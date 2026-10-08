package com.innovatex.wortweg370.preview;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/** Enables the user's default-on in-app music while preserving the settings toggles. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }
}
