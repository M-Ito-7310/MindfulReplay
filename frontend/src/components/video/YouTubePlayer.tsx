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

  // Web-specific state and refs
  const [webPlayer, setWebPlayer] = useState<any>(null);
  const [isWebApiLoaded, setIsWebApiLoaded] = useState(false);
  const webTimeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const lastWebTime = useRef(-1);

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
  const playerId = `youtube-player-${extractVideoId(videoId)}-${Date.now()}`;

  // Only log errors for invalid dimensions
  if (__DEV__ && (!playerWidth || !playerHeight)) {
    console.error('[YouTubePlayer] Invalid dimensions:', playerWidth, playerHeight);
  }

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

  // Web: Load YouTube IFrame API
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        setIsWebApiLoaded(true);
        return;
      }

      if (!document.getElementById('youtube-api-script')) {
        const script = document.createElement('script');
        script.id = 'youtube-api-script';
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (__DEV__) {
          console.log('[YouTubePlayer] Web YouTube API loaded');
        }
        setIsWebApiLoaded(true);
      };
    };

    loadYouTubeAPI();
  }, []);

  // Web: Initialize player when API is ready
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!isWebApiLoaded || !videoId || webPlayer) return;

    const cleanVideoId = extractVideoId(videoId);
    if (__DEV__) {
      console.log('[YouTubePlayer] Web initializing player:', {
        videoId: cleanVideoId,
        playerId,
        autoplay
      });
    }

    const player = new window.YT.Player(playerId, {
      height: playerHeight,
      width: playerWidth,
      videoId: cleanVideoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        start: initialTime,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1
      },
      events: {
        onReady: (event) => {
          if (__DEV__) {
            console.log('[YouTubePlayer] Web player ready');
          }
          setWebPlayer(event.target);
          setIsReady(true);
          onReady?.();
          
          // Start timeUpdate interval
          const startTimeUpdate = () => {
            if (webTimeUpdateInterval.current) {
              clearInterval(webTimeUpdateInterval.current);
            }
            
            webTimeUpdateInterval.current = setInterval(() => {
              if (event.target && typeof event.target.getCurrentTime === 'function') {
                try {
                  const currentTime = event.target.getCurrentTime();
                  const playerState = event.target.getPlayerState();
                  
                  // Send updates more frequently for better responsiveness
                  const roundedTime = Math.floor(currentTime * 10) / 10; // 0.1s precision
                  if (Math.abs(roundedTime - lastWebTime.current) >= 0.1) {
                    onTimeUpdate?.(currentTime);
                    lastWebTime.current = roundedTime;
                  }
                  
                  // Adjust interval based on playback state
                  const isPlaying = playerState === window.YT.PlayerState.PLAYING;
                  if (!isPlaying && webTimeUpdateInterval.current) {
                    clearInterval(webTimeUpdateInterval.current);
                    webTimeUpdateInterval.current = setInterval(() => startTimeUpdate(), 2000); // 2s when paused
                  }
                } catch (error) {
                  if (__DEV__) {
                    console.error('[YouTubePlayer] Web timeUpdate error:', error);
                  }
                }
              }
            }, 200); // 200ms for smoother updates
          };
          
          startTimeUpdate();
        },
        onStateChange: (event) => {
          let state = 'unknown';
          
          switch (event.data) {
            case window.YT.PlayerState.PLAYING:
              state = 'playing';
              // Restart timeUpdate with 1s interval when playing
              if (webTimeUpdateInterval.current) {
                clearInterval(webTimeUpdateInterval.current);
              }
              webTimeUpdateInterval.current = setInterval(() => {
                if (event.target && typeof event.target.getCurrentTime === 'function') {
                  try {
                    const currentTime = event.target.getCurrentTime();
                    const roundedTime = Math.floor(currentTime * 10) / 10; // 0.1s precision
                    if (Math.abs(roundedTime - lastWebTime.current) >= 0.1) {
                      onTimeUpdate?.(currentTime);
                      lastWebTime.current = roundedTime;
                    }
                  } catch (error) {
                    if (__DEV__) {
                      console.error('[YouTubePlayer] Web timeUpdate error:', error);
                    }
                  }
                }
              }, 200); // 200ms for smoother updates
              break;
            case window.YT.PlayerState.PAUSED:
              state = 'paused';
              break;
            case window.YT.PlayerState.ENDED:
              state = 'ended';
              // Clear timeUpdate when video ends
              if (webTimeUpdateInterval.current) {
                clearInterval(webTimeUpdateInterval.current);
                webTimeUpdateInterval.current = null;
              }
              break;
          }
          
          if (__DEV__ && state !== 'unknown') {
            console.log('[YouTubePlayer] Web state changed:', state);
          }
          onPlaybackStateChange?.(state as 'playing' | 'paused' | 'ended');
        },
        onError: (event) => {
          if (__DEV__) {
            console.error('[YouTubePlayer] Web error:', event.data);
          }
          const youtubeError = getYouTubeError(event.data);
          onError?.(youtubeError.message, event.data);
        }
      }
    });

    return () => {
      if (webTimeUpdateInterval.current) {
        clearInterval(webTimeUpdateInterval.current);
        webTimeUpdateInterval.current = null;
      }
    };
  }, [isWebApiLoaded, videoId, playerId, playerHeight, playerWidth, autoplay, initialTime]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (webTimeUpdateInterval.current) {
        clearInterval(webTimeUpdateInterval.current);
      }
    };
  }, []);
  
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
            
            // Make updateTime globally accessible for message handlers
            window.updateTime = function() {
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
                        window.timeUpdateInterval = setTimeout(window.updateTime, nextInterval);
                        
                    } catch (e) {
                        // Player might not be ready, retry in 1 second
                        if (window.timeUpdateInterval) {
                            clearTimeout(window.timeUpdateInterval);
                        }
                        window.timeUpdateInterval = setTimeout(window.updateTime, 1000);
                    }
                }
            }
            
            // Start the smart update cycle
            window.updateTime();
        }
        
        function onPlayerStateChange(event) {
            let state = 'unknown';
            
            switch (event.data) {
                case YT.PlayerState.PLAYING:
                    state = 'playing';
                    // Immediately trigger time update when resuming playback
                    if (window.timeUpdateInterval) {
                        clearTimeout(window.timeUpdateInterval);
                    }
                    window.timeUpdateInterval = setTimeout(window.updateTime, 100);
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
        function handleMessage(event) {
            const data = JSON.parse(event.data);
            
            if (!player || !isPlayerReady) {
                return;
            }
            
            switch (data.type) {
                case 'play':
                    player.playVideo();
                    // Immediately trigger time update when play is called
                    if (window.timeUpdateInterval) {
                        clearTimeout(window.timeUpdateInterval);
                    }
                    window.timeUpdateInterval = setTimeout(window.updateTime, 100);
                    break;
                case 'pause':
                    player.pauseVideo();
                    break;
                case 'seekTo':
                    player.seekTo(data.time);
                    // Immediately trigger time update after seeking
                    if (window.timeUpdateInterval) {
                        clearTimeout(window.timeUpdateInterval);
                    }
                    window.timeUpdateInterval = setTimeout(window.updateTime, 100);
                    break;
                case 'getCurrentTime':
                    const currentTime = player.getCurrentTime();
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'currentTimeResponse',
                        currentTime: currentTime
                    }));
                    break;
            }
        }
        
        // Add multiple event listeners for cross-platform compatibility
        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);
        
        // Also add a global function for direct calls
        window.handleReactNativeMessage = handleMessage;
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
      try {
        // Primary method: postMessage
        webViewRef.current.postMessage(JSON.stringify(message));
        
        // Alternative method: injectedJavaScript for immediate execution
        const jsCode = `
          try {
            if (window.handleReactNativeMessage) {
              window.handleReactNativeMessage({data: '${JSON.stringify(message)}'});
            }
          } catch (e) {
            console.log('Failed to handle message via injectedJS:', e);
          }
          true; // Always return true for injectedJavaScript
        `;
        webViewRef.current.injectJavaScript(jsCode);
      } catch (error) {
        if (__DEV__) {
          console.error('[YouTubePlayer] Error sending message:', error);
        }
      }
    }
  };

  // Public methods
  const play = () => sendMessage({ type: 'play' });
  const pause = () => sendMessage({ type: 'pause' });
  const seekTo = (time: number) => sendMessage({ type: 'seekTo', time });
  const getCurrentTime = () => sendMessage({ type: 'getCurrentTime' });

  // Expose methods via ref - unified for both platforms
  React.useImperativeHandle(ref, () => {
    if (Platform.OS === 'web') {
      return {
        play: () => {
          if (webPlayer && typeof webPlayer.playVideo === 'function') {
            if (__DEV__) {
              console.log('[YouTubePlayer] Web play()');
            }
            webPlayer.playVideo();
          }
        },
        pause: () => {
          if (webPlayer && typeof webPlayer.pauseVideo === 'function') {
            if (__DEV__) {
              console.log('[YouTubePlayer] Web pause()');
            }
            webPlayer.pauseVideo();
          }
        },
        seekTo: (time: number) => {
          if (webPlayer && typeof webPlayer.seekTo === 'function') {
            if (__DEV__) {
              console.log('[YouTubePlayer] Web seekTo:', time);
            }
            webPlayer.seekTo(time, true);
          }
        },
        getCurrentTime: () => {
          if (webPlayer && typeof webPlayer.getCurrentTime === 'function') {
            return webPlayer.getCurrentTime();
          }
          return 0;
        },
      };
    } else {
      return {
        play,
        pause,
        seekTo,
        getCurrentTime,
      };
    }
  }, [webPlayer]);

  // Web platform implementation using YouTube IFrame API
  if (Platform.OS === 'web') {
    const cleanVideoId = extractVideoId(videoId);

    if (__DEV__ && lastLoggedVideoIdRef.current !== videoId) {
      console.log('[YouTubePlayer] Web YouTube IFrame API:', cleanVideoId, `${playerWidth}x${playerHeight}`);
      lastLoggedVideoIdRef.current = videoId;
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
        <div
          id={playerId}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.BLACK,
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