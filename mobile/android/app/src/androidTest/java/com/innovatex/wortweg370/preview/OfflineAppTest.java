package com.innovatex.wortweg370.preview;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import com.getcapacitor.BridgeWebViewClient;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.util.Collections;
import android.view.MotionEvent;
import android.os.SystemClock;
import org.json.JSONObject;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class OfflineAppTest {
    private String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, value -> {
            result.set(value); latch.countDown();
        }));
        assertTrue("WebView JavaScript responded", latch.await(15, TimeUnit.SECONDS));
        return result.get();
    }
    private void waitFor(ActivityScenario<MainActivity> scenario, String condition) throws Exception {
        long deadline = System.currentTimeMillis() + 30000;
        while (System.currentTimeMillis() < deadline) {
            if ("true".equals(evaluate(scenario, "Boolean("+condition+")"))) return;
            Thread.sleep(250);
        }
        fail("Offline app condition timed out: " + condition + " · " + evaluate(scenario,"JSON.stringify({audio:window.WortWegAudio?.getStatus(),trace:window.WortWegNative?.audioTrace,context:typeof AudioContext,engine:typeof meSpeak})"));
    }
    @Test public void bundledLearningAndSpeechWorkWithoutNetwork() throws Exception {
        // Workflow disables Wi-Fi and mobile data before this test starts.
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            waitFor(scenario, "window.WortWeg && window.WortWegNative.accountReady && document.getElementById('mobile-time')");
            // The requested sound-on defaults must be present before the first tap.
            assertEquals("true",evaluate(scenario,
                "document.getElementById('pref-touchSound').checked && document.getElementById('pref-backgroundMusic').checked"));
            scenario.onActivity(activity -> assertFalse(
                "The Android WebView should permit music without a tap",
                activity.getBridge().getWebView().getSettings().getMediaPlaybackRequiresUserGesture()));
            // App-bundled lessons must work on a first launch without the website.
            waitFor(scenario, "window.WortWegLive && window.WortWegLive.getPack() && window.WortWegLive.getPack().lessons.length >= 4");
            assertEquals("true",evaluate(scenario, "WortWegLive.getPack().schema===1"));
            // Emulators can report navigator.onLine=true without usable internet.
            // Reject every external request explicitly; local Capacitor assets remain served.
            scenario.onActivity(activity -> {
                activity.getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(activity.getBridge()) {
                    @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                        if (!"localhost".equals(request.getUrl().getHost())) {
                            return new WebResourceResponse("text/plain", "UTF-8", 503, "Offline test", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
                        }
                        return super.shouldInterceptRequest(view, request);
                    }
                });
            });
            evaluate(scenario,"window.__reloading=true;location.reload()");
            waitFor(scenario, "!window.__reloading && window.WortWeg && window.WortWegNative.accountReady && document.getElementById('mobile-time')");
            evaluate(scenario,"window.__offlineProbe=false;fetch('https://example.com/offline-test').then(r=>window.__offlineProbe=!r.ok).catch(()=>window.__offlineProbe=true)");
            waitFor(scenario,"window.__offlineProbe");
            assertEquals("true",evaluate(scenario,"location.hostname === 'localhost'"));
            evaluate(scenario,"WortWeg.navigate('study');document.getElementById('startQuiz').click();document.querySelector('#answerButtons .choice').click();document.getElementById('submitAnswer').click()");
            assertEquals("1",evaluate(scenario,"WortWeg.getProgress().answered"));
            evaluate(scenario,"window.__reloading=true;location.reload()");
            waitFor(scenario,"!window.__reloading && window.WortWeg && window.WortWegNative.accountReady && document.getElementById('mobile-time')");
            assertEquals("1",evaluate(scenario,"WortWeg.getProgress().answered"));
            // Force app-owned speech, regardless of emulator system voices.
            waitFor(scenario,"WortWegAudio.getStatus().state==='ready'");
            evaluate(scenario,"window.speechSynthesis.getVoices=()=>[];WortWeg.navigate('settings');document.getElementById('audio-pack-test').scrollIntoView({block:'center'})");
            Thread.sleep(300);
            JSONObject point = new JSONObject(evaluate(scenario,"(()=>{const r=document.getElementById('audio-pack-test').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:innerWidth}})()"));
            scenario.onActivity(activity -> {
                WebView view=activity.getBridge().getWebView();
                float scale=(float)(view.getWidth()/point.optDouble("width"));
                float x=(float)point.optDouble("x")*scale,y=(float)point.optDouble("y")*scale;
                long now=SystemClock.uptimeMillis();
                MotionEvent down=MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,x,y,0);
                MotionEvent up=MotionEvent.obtain(now,now+100,MotionEvent.ACTION_UP,x,y,0);
                view.dispatchTouchEvent(down);view.dispatchTouchEvent(up);down.recycle();up.recycle();
            });
            evaluate(scenario,"WortWegAudio.test()");
            waitFor(scenario,"window.meSpeak && meSpeak.isVoiceLoaded('de')");
            assertEquals("true",evaluate(scenario,"(()=>{const wav=meSpeak.speak('Guten Tag',{voice:'de',rawdata:'array'});return wav.length>10000 && wav[0]===82 && wav[1]===73 && wav.slice(44).some(x=>x!==0)})()"));
            assertEquals("\"ready\"",evaluate(scenario,"WortWegAudio.getStatus().state"));
        }
    }
}
