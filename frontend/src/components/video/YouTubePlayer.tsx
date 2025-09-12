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
  onError?: (error: string, errorCode?: number) => void;
  autoplay?: boolean;
  width?: number;
  height?: number;
}

interface YouTubeError {
  code: number;
  message: string;
  description: string;
  solution: string;
  isEmbeddingRestricted: boolean;
}

const getYouTubeError = (errorCode: number): YouTubeError => {
  const errors: Record<number, YouTubeError> = {
    2: {
      code: 2,
      message: '無効なパラメータ',
      description: '動画IDまたはプレイヤーパラメータが無効です',
      solution: '動画URLを確認してください',
      isEmbeddingRestricted: false
    },
    5: {
      code: 5,
      message: 'HTML5プレイヤー非対応',
      description: 'この動画はHTML5プレイヤーで再生できません',
      solution: 'ブラウザを更新するか、別の動画をお試しください',
      isEmbeddingRestricted: false
    },
    100: {
      code: 100,
      message: '動画が見つかりません',
      description: '動画が削除されているか、プライベート設定です',
      solution: '動画URLを確認するか、別の動画をお試しください',
      isEmbeddingRestricted: false
    },
    101: {
      code: 101,
      message: '埋め込み再生禁止',
      description: '動画の所有者が埋め込み再生を許可していません',
      solution: 'YouTubeで直接視聴してください',
      isEmbeddingRestricted: true
    },
    150: {
      code: 150,
      message: '埋め込み再生制限',
      description: 'この動画は埋め込みプレイヤーでの再生が制限されています',
      solution: 'YouTubeで直接視聴してください',
      isEmbeddingRestricted: true
    }
  };
  
  return errors[errorCode] || {
    code: errorCode,
    message: '不明なエラー',
    description: `エラーコード: ${errorCode}`,
    solution: 'しばらく時間をおいてから再試行してください',
    isEmbeddingRestricted: false
  };
};

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
  const lastLoggedVideoIdRef = useRef<string | null>(null);
  const lastLoggedMobileVideoRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    dimensions.width < dimensions.height ? 'portrait' : 'landscape'
  );

  // Update orientation when window dimensions change
  useEffect(() => {
    const updateDimensions = () => {
      const newDimensions = Dimensions.get('window');
      setDimensions(newDimensions);
      setOrientation(newDimensions.width < newDimensions.height ? 'portrait' : 'landscape');
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Calculate optimal player dimensions based on orientation
  const calculatePlayerDimensions = () => {
    // Ensure we have valid dimensions
    const screenWidth = dimensions.width || Dimensions.get('window').width;
    const screenHeight = dimensions.height || Dimensions.get('window').height;
    const aspectRatio = 16 / 9;
    const minWidth = 200; // Minimum width for YouTube player
    const minHeight = 200; // Minimum height for YouTube player
    
    if (orientation === 'landscape') {
      // Landscape: Maximize screen usage
      const padding = Platform.select({
        ios: 8,
        android: 0,
        web: 8,
        default: 8
      });
      
      const maxWidth = width || Math.max(screenWidth - padding, minWidth);
      const maxHeight = height || Math.max(screenHeight * 0.9, minHeight); // Use 90% of screen height
      
      // Calculate dimensions maintaining aspect ratio
      let playerWidth = maxWidth;
      let playerHeight = playerWidth / aspectRatio;
      
      // If calculated height exceeds max height, recalculate based on height
      if (playerHeight > maxHeight) {
        playerHeight = maxHeight;
        playerWidth = playerHeight * aspectRatio;
      }
      
      // Ensure minimum dimensions
      playerWidth = Math.max(playerWidth, minWidth);
      playerHeight = Math.max(playerHeight, minHeight);
      
      return { width: Math.floor(playerWidth), height: Math.floor(playerHeight) };
    } else {
      // Portrait: Optimize for width with appropriate padding
      const padding = Platform.select({
        ios: 32,
        android: 24,
        web: 32,
        default: 32
      });
      
      const maxWidth = width || Math.max(screenWidth - padding, minWidth);
      const playerWidth = Math.max(maxWidth, minWidth);
      const playerHeight = Math.max(height || (playerWidth * 9) / 16, minHeight);
      
      return { width: Math.floor(playerWidth), height: Math.floor(playerHeight) };
    }
  };

  const { width: playerWidth, height: playerHeight } = calculatePlayerDimensions();
  
  // Only log errors for invalid dimensions
  if (__DEV__ && (!playerWidth || !playerHeight)) {
    console.error('[YouTubePlayer] Invalid dimensions:', playerWidth, playerHeight);
  }
  
  // Optimized user agent for better YouTube compatibility
  const getUserAgent = (): string => {
    const baseUA = 'Mozilla/5.0';
    if (Platform.OS === 'ios') {
      return `${baseUA} (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1`;
    } else if (Platform.OS === 'android') {
      return `${baseUA} (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36`;
    }
    return `${baseUA} (compatible; ReactNativeWebView)`;
  };

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
    
    // Log only essential info when generating player
    if (__DEV__ && videoId !== lastLoggedVideoIdRef.current) {
      console.log('[YouTubePlayer] Init:', cleanVideoId, `${playerWidth}x${playerHeight}`, Platform.OS);
      lastLoggedVideoIdRef.current = videoId;
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
        }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #player-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #player {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
        }
    </style>
</head>
<body>
    <div id="player-container">
        <div id="player"></div>
    </div>
    
    <script>
        let player;
        let isPlayerReady = false;
        
        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = function() {
            console.error('[YouTubePlayer] Failed to load YouTube IFrame API');
        };
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
                    start: ${initialTime},
                    origin: window.location.origin || 'https://localhost',
                    widget_referrer: window.location.href || 'https://localhost'
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
            
            // Smart time update with state-based intervals
            let lastTime = -1;
            window.timeUpdateInterval = null;
            
            function updateTime() {
                if (player && isPlayerReady) {
                    try {
                        const currentTime = player.getCurrentTime();
                        const playerState = player.getPlayerState();
                        
                        // Only send updates if time actually changed
                        const roundedTime = Math.floor(currentTime);
                        if (roundedTime !== lastTime) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'timeUpdate',
                                currentTime: currentTime
                            }));
                            lastTime = roundedTime;
                        }
                        
                        // Adjust interval based on playback state
                        const isPlaying = playerState === YT.PlayerState.PLAYING;
                        const nextInterval = isPlaying ? 1000 : 5000; // 1s when playing, 5s when paused
                        
                        if (window.timeUpdateInterval) {
                            clearTimeout(window.timeUpdateInterval);
                        }
                        window.timeUpdateInterval = setTimeout(updateTime, nextInterval);
                        
                    } catch (e) {
                        // Player might not be ready, retry in 1 second
                        if (window.timeUpdateInterval) {
                            clearTimeout(window.timeUpdateInterval);
                        }
                        window.timeUpdateInterval = setTimeout(updateTime, 1000);
                    }
                }
            }
            
            // Start the smart update cycle
            updateTime();
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
                    // Stop time updates when video ends
                    if (window.timeUpdateInterval) {
                        clearTimeout(window.timeUpdateInterval);
                        window.timeUpdateInterval = null;
                    }
                    break;
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'stateChange',
                state: state
            }));
        }
        
        function onPlayerError(event) {
            let errorCode = event.data;
            let errorInfo = {
                2: { msg: 'Invalid video ID or parameter', restricted: false },
                5: { msg: 'Video not available in HTML5 player', restricted: false },
                100: { msg: 'Video not found or removed', restricted: false },
                101: { msg: 'Video owner does not allow embedding', restricted: true },
                150: { msg: 'Video restricted from playback in embedded players', restricted: true }
            }[errorCode] || { msg: 'Unknown error', restricted: false };
            
            console.error('[YouTubePlayer] Video error:', {
                videoId: '${cleanVideoId}',
                errorCode: errorCode,
                errorMessage: errorInfo.msg,
                isEmbeddingRestricted: errorInfo.restricted,
                platform: '${Platform.OS}'
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                error: errorInfo.msg,
                errorCode: errorCode,
                isEmbeddingRestricted: errorInfo.restricted
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
      
      // Log only important messages, skip timeUpdate spam
      if (__DEV__ && data.type !== 'timeUpdate') {
        console.log('[YouTubePlayer]', data.type, ':', videoId, data.state || data.error || '');
      }
      
      switch (data.type) {
        case 'debug':
          // Ignore debug messages unless needed
          break;
          
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
          const youtubeError = getYouTubeError(data.errorCode || 0);
          
          if (__DEV__) {
            console.error('[YouTubePlayer] Video playback error:', {
              videoId,
              errorCode: data.errorCode,
              errorMessage: data.error,
              youtubeError,
              platform: Platform.OS
            });
          }
          
          onError?.(youtubeError.message, data.errorCode);
          
          // Show detailed error to user
          Alert.alert(
            '動画再生エラー',
            `${youtubeError.message}\n\n${youtubeError.description}\n\n解決方法: ${youtubeError.solution}`,
            [
              { text: 'OK', style: 'default' },
              ...(youtubeError.isEmbeddingRestricted ? [
                {
                  text: 'YouTubeで視聴',
                  onPress: () => {
                    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    if (__DEV__) {
                      console.log('[YouTubePlayer] Opening YouTube URL:', youtubeUrl);
                    }
                    // Here you would typically use Linking.openURL(youtubeUrl)
                  }
                }
              ] : [])
            ]
          );
          break;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[YouTubePlayer] Error parsing WebView message:', error);
      }
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
    
    if (__DEV__) {
      console.log('[YouTubePlayer] Web iframe implementation:', {
        videoId,
        cleanVideoId,
        iframeSrc,
        orientation,
        dimensions,
        playerWidth,
        playerHeight
      });
    }
    
    return (
      <View style={[
        styles.container, 
        { 
          width: playerWidth, 
          height: playerHeight,
          borderRadius: orientation === 'landscape' ? 0 : 8
        }
      ]}>
        <iframe
          src={iframeSrc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: COLORS.BLACK,
            display: 'block',
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
  // Minimal mobile logging - only log once per video
  if (__DEV__ && lastLoggedMobileVideoRef.current !== videoId) {
    console.log('[YouTubePlayer] Mobile WebView:', videoId, `${playerWidth}x${playerHeight}`);
    lastLoggedMobileVideoRef.current = videoId;
  }
  
  return (
    <View style={[
      styles.container, 
      { 
        width: playerWidth, 
        height: playerHeight,
        borderRadius: orientation === 'landscape' ? 0 : 8,
        minHeight: 200,
        minWidth: 200
      }
    ]}>
      <WebView
        key={`youtube-player-${videoId}`}
        ref={webViewRef}
        source={{ html: generateHTML() }}
        style={[styles.webView, { width: playerWidth, height: playerHeight }]}
        onMessage={handleMessage}
        userAgent={getUserAgent()}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode={Platform.OS === 'android' ? 'compatibility' : 'never'}
        allowsFullscreenVideo={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        allowsProtectedMedia={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        scalesPageToFit={Platform.OS === 'android'}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        injectedJavaScript={`
          // Minimal injection
          true;
        `}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (__DEV__) {
            console.error('[YouTubePlayer] WebView error for video:', videoId, nativeEvent);
          }
          console.error('WebView error: ', nativeEvent);
          onError?.('WebView failed to load');
        }}
        onLoadStart={() => {
          // Remove verbose loading logs
        }}
        onLoadEnd={() => {
          // Remove verbose loading logs
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
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    minWidth: 200,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
    opacity: 0.99, // iOS WebView rendering workaround
  },
});