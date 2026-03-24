import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";

const FALLBACK_MARKETPLACE_URL = "https://app.buddiesworldwide.online";
const INTERNAL_HOSTS = new Set([
  "buddiesworldwide.online",
  "app.buddiesworldwide.online",
  "id.buddiesworldwide.online",
  "checkout.paystack.com",
  "standard.paystack.co",
]);

type LoadState = {
  canGoBack: boolean;
  hasError: boolean;
  isLoading: boolean;
};

function getMarketplaceUrl() {
  const configuredUrl = Constants.expoConfig?.extra?.marketplaceUrl;
  return typeof configuredUrl === "string" && configuredUrl.length > 0
    ? configuredUrl
    : FALLBACK_MARKETPLACE_URL;
}

function isInternalHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) && INTERNAL_HOSTS.has(parsed.host);
  } catch {
    return false;
  }
}

function shouldOpenExternally(url: string) {
  return (
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("sms:") ||
    url.startsWith("whatsapp:") ||
    url.startsWith("https://wa.me/")
  );
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const marketplaceUrl = useMemo(() => getMarketplaceUrl(), []);
  const [loadState, setLoadState] = useState<LoadState>({
    canGoBack: false,
    hasError: false,
    isLoading: true,
  });

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!loadState.canGoBack) {
        return false;
      }

      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [loadState.canGoBack]);

  const handleNavigationStateChange = (navigationState: WebViewNavigation) => {
    setLoadState((current) => ({
      ...current,
      canGoBack: navigationState.canGoBack,
    }));
  };

  const handleRetry = () => {
    setLoadState((current) => ({
      ...current,
      hasError: false,
      isLoading: true,
    }));
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <WebView
          ref={webViewRef}
          source={{ uri: marketplaceUrl }}
          onLoadStart={() =>
            setLoadState((current) => ({ ...current, hasError: false, isLoading: true }))
          }
          onLoadEnd={() =>
            setLoadState((current) => ({ ...current, isLoading: false }))
          }
          onError={() =>
            setLoadState((current) => ({ ...current, hasError: true, isLoading: false }))
          }
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={(request) => {
            if (isInternalHttpUrl(request.url)) {
              return true;
            }

            if (shouldOpenExternally(request.url)) {
              void Linking.openURL(request.url);
            }

            return false;
          }}
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          originWhitelist={["http://*", "https://*"]}
          applicationNameForUserAgent="BuddiesWorldwideMobile/0.1.0"
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#C2410C" size="large" />
              <Text style={styles.loadingTitle}>Opening Buddies Worldwide</Text>
              <Text style={styles.loadingCopy}>
                Verified marketplace access for South Africa.
              </Text>
            </View>
          )}
        />

        {loadState.hasError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Connection lost</Text>
            <Text style={styles.errorCopy}>
              We could not load the marketplace right now. Check your connection or try again.
            </Text>
            <View style={styles.errorActions}>
              <Pressable onPress={handleRetry} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Try again</Text>
              </Pressable>
              <Pressable
                onPress={() => void Linking.openURL(marketplaceUrl)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Open in browser</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5E9D8",
  },
  root: {
    flex: 1,
    backgroundColor: "#F5E9D8",
  },
  loadingOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#F5E9D8",
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: "#1F2937",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingCopy: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  errorCard: {
    position: "absolute",
    right: 16,
    left: 16,
    bottom: 20,
    borderRadius: 24,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    padding: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  errorTitle: {
    color: "#9A3412",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  errorCopy: {
    color: "#7C2D12",
    fontSize: 14,
    lineHeight: 21,
  },
  errorActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#C2410C",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#FFF7ED",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FDBA74",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#9A3412",
    fontSize: 15,
    fontWeight: "700",
  },
});
