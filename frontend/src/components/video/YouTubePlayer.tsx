import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/constants/theme';

interface YouTubePlayerProps {
  videoId: string;
  initialTime?: number;
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlaybackStateChange?: (state: 'playing' | 'paused' | 'ended') => void;
  onError?: (error: string) => void;
  autoplay?: boolean;
  width?: number;
  height?: number;
}

export const YouTubePlayer = React.forwardRef<any, YouTubePlayerProps>(({
  videoId,
  initialTime = 0,
  onReady,
  onTimeUpdate,
  onPlaybackStateChange,
  onError,
  autoplay = false,
  width,
  height,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const playerWidth = width || screenWidth - 32;
  const playerHeight = height || (playerWidth * 9) / 16; // 16:9 aspect ratio

  useEffect(() => {
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  const extractVideoId = (url: string): string => {
    if (url.length === 11) return url; // Already a video ID
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return url;
  };

  const generateHTML = (): string => {
    const cleanVideoId = extractVideoId(videoId);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        #player {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="player"></div>
    
    <script>
        let player;
        let isPlayerReady = false;
        
        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Initialize player when API is ready
        function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
                width: '100%',
                height: '100%',
                videoId: '${cleanVideoId}',
                playerVars: {
                    autoplay: ${autoplay ? 1 : 0},
                    controls: 1,
                    disablekb: 0,
                    enablejsapi: 1,
                    fs: 1,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    start: ${initialTime}
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onPlayerError
                }
            });
        }
        
        function onPlayerReady(event) {
            isPlayerReady = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ready'
            }));
            
            // Start time update interval
            setInterval(() => {
                if (player && isPlayerReady) {
                    try {
                        const currentTime = player.getCurrentTime();
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'timeUpdate',
                            currentTime: currentTime
                        }));
                    } catch (e) {
                        // Player might not be ready
                    }
                }
            }, 1000);
        }
        
        function onPlayerStateChange(event) {
            let state = 'unknown';
            
            switch (event.data) {
                case YT.PlayerState.PLAYING:
                    state = 'playing';
                    break;
                case YT.PlayerState.PAUSED:
                    state = 'paused';
                    break;
                case YT.PlayerState.ENDED:
                    state = 'ended';
                    break;
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'stateChange',
                state: state
            }));
        }
        
        function onPlayerError(event) {
            let errorMessage = 'Unknown error';
            
            switch (event.data) {
                case 2:
                    errorMessage = 'Invalid video ID';
                    break;
                case 5:
                    errorMessage = 'Video not available in HTML5 player';
                    break;
                case 100:
                    errorMessage = 'Video not found';
                    break;
                case 101:
                case 150:
                    errorMessage = 'Video not allowed to be played in embedded players';
                    break;
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                error: errorMessage
            }));
        }
        
        // Handle messages from React Native
        document.addEventListener('message', function(event) {
            const data = JSON.parse(event.data);
            
            if (!player || !isPlayerReady) return;
            
            switch (data.type) {
                case 'play':
                    player.playVideo();
                    break;
                case 'pause':
                    player.pauseVideo();
                    break;
                case 'seekTo':
                    player.seekTo(data.time);
                    break;
                case 'getCurrentTime':
                    const currentTime = player.getCurrentTime();
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'currentTimeResponse',
                        currentTime: currentTime
                    }));
                    break;
            }
        });
    </script>
</body>
</html>`;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'ready':
          setIsReady(true);
          onReady?.();
          break;
          
        case 'timeUpdate':
          onTimeUpdate?.(data.currentTime);
          break;
          
        case 'stateChange':
          onPlaybackStateChange?.(data.state);
          break;
          
        case 'error':
          onError?.(data.error);
          Alert.alert('動画エラー', data.error);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const sendMessage = (message: any) => {
    if (webViewRef.current && isReady) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

  // Public methods
  const play = () => sendMessage({ type: 'play' });
  const pause = () => sendMessage({ type: 'pause' });
  const seekTo = (time: number) => sendMessage({ type: 'seekTo', time });
  const getCurrentTime = () => sendMessage({ type: 'getCurrentTime' });

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    play,
    pause,
    seekTo,
    getCurrentTime,
  }));

  // Web platform implementation using iframe
  if (Platform.OS === 'web') {
    const cleanVideoId = extractVideoId(videoId);
    const iframeSrc = `https://www.youtube.com/embed/${cleanVideoId}?enablejsapi=1&autoplay=${autoplay ? 1 : 0}&start=${initialTime}&controls=1&modestbranding=1&rel=0`;
    
    return (
      <View style={[styles.container, { width: playerWidth, height: playerHeight }]}>
        <iframe
          src={iframeSrc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: COLORS.BLACK,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setIsReady(true);
            onReady?.();
          }}
        />
      </View>
    );
  }

  // Mobile implementation using WebView
  return (
    <View style={[styles.container, { width: playerWidth, height: playerHeight }]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateHTML() }}
        style={styles.webView}
        onMessage={handleMessage}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        allowsFullscreenVideo={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
          onError?.('WebView failed to load');
        }}
      />
    </View>
  );
});

// Add display name for better debugging
YouTubePlayer.displayName = 'YouTubePlayer';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BLACK,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },
});