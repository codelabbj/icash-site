'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, RefreshCw, Loader2, ArrowLeft, MessageSquare, Moon, Sun } from 'lucide-react';
import { notificationApi } from '@/lib/api-client';
import { Notification } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { fcmService } from '@/lib/firebase';
import type { MessagePayload } from 'firebase/messaging';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import icashLogo from '@/public/icash-logo.png';

// Extended notification type to include FCM notifications
interface FCMNotification {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_fcm: true;
  payload?: MessagePayload;
}

type CombinedNotification = Notification | FCMNotification;

export default function NotificationsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    top: number
    delay: number
    duration: number
    x: number
  }>>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fcmNotifications, setFcmNotifications] = useState<FCMNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate particle positions only on client side
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
        x: (Math.random() - 0.5) * 200
      }))
    )
  }, []);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setIsRefreshing(pageNum === 1);
      setIsLoading(pageNum === 1);
      
      const response = await notificationApi.getAll(pageNum);
      
      setNotifications(response.results);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchNotifications(page);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [page]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFcmNotifications = localStorage.getItem('fcm_notifications');
      if (storedFcmNotifications) {
        try {
          const parsed = JSON.parse(storedFcmNotifications);
          setFcmNotifications(parsed);
        } catch (error) {
          console.error('Error loading FCM notifications from storage:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFCMMessage = (payload: MessagePayload) => {
      console.log('FCM notification received in notifications page:', payload);
      
      const fcmNotification: FCMNotification = {
        id: `fcm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: payload.notification?.title || 'New Notification',
        content: payload.notification?.body || payload.data?.body || 'You have a new notification',
        created_at: new Date().toISOString(),
        is_read: false,
        is_fcm: true,
        payload: payload,
      };

      setFcmNotifications(prev => {
        const updated = [fcmNotification, ...prev];
        localStorage.setItem('fcm_notifications', JSON.stringify(updated));
        return updated;
      });

      try {
        if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) {
          console.warn('Notification API not available');
          return;
        }
        
        const permission = window.Notification?.permission;
        if (permission !== 'granted') {
          console.warn('Notification permission not granted:', permission);
          return;
        }
        
        const notification = new window.Notification(fcmNotification.title, {
          body: fcmNotification.content,
          icon: '/placeholder-logo.png',
          badge: '/placeholder-logo.png',
          tag: fcmNotification.id,
          requireInteraction: false,
        });

        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          
          if (payload.data?.url) {
            window.open(payload.data.url, '_blank');
          }
          
          notification.close();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    };

    fcmService.setupForegroundListener(handleFCMMessage);

    if ('serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.firebaseMessaging) {
          const payload = event.data.firebaseMessaging;
          handleFCMMessage(payload);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
  }, []);

  const markAsRead = async (notificationId: number | string) => {
    if (typeof notificationId === 'string' && notificationId.startsWith('fcm-')) {
      setFcmNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      
      const updated = fcmNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      );
      localStorage.setItem('fcm_notifications', JSON.stringify(updated));
      
      toast.success('Notification marked as read');
      return;
    }

    try {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM à HH:mm');
    } catch {
      return dateString;
    }
  };

  const allNotifications: CombinedNotification[] = [
    ...fcmNotifications,
    ...notifications,
  ].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#2563EB] rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF8C42] rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Shapes */}
        <div 
          className="absolute top-20 left-10 w-40 h-40 bg-[#FF6B35] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float 6s ease-in-out infinite' }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-32 h-32 bg-[#2563EB] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float-delayed 8s ease-in-out infinite 1s' }}
        ></div>
        <div 
          className="absolute bottom-32 left-1/4 w-48 h-48 bg-[#FF8C42] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float-slow 10s ease-in-out infinite 2s' }}
        ></div>
        <div 
          className="absolute bottom-20 right-1/3 w-36 h-36 bg-[#FF6B35] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float 7s ease-in-out infinite 0.5s' }}
        ></div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 107, 53, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 53, 0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>

        {/* Particle Effect */}
        {particles.length > 0 && (
          <div className="absolute inset-0">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-4 h-4 bg-[#FF6B35] rounded-full opacity-70"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animation: `particle ${particle.duration}s linear infinite`,
                  animationDelay: `${particle.delay}s`,
                  '--random-x': `${particle.x}px`
                } as React.CSSProperties & { '--random-x': string }}
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Zone centrale */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto flex flex-col pt-4 sm:pt-6">
          {/* Header avec logo et icônes */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Image src={icashLogo} alt="iCASH logo" className="w-8 h-8" />
              <span className="text-foreground font-semibold text-lg">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {unreadCount}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchNotifications()}
                disabled={isRefreshing}
                className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/50"
              >
                {isRefreshing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/50"
                onClick={() => {
                  if (mounted) {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                }}
                title={mounted ? `Passer en mode ${resolvedTheme === "dark" ? "clair" : "sombre"}` : "Changer le thème"}
              >
                {mounted ? (
                  resolvedTheme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                  <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                </div>
                <p className="text-sm text-muted-foreground">Chargement des notifications...</p>
              </div>
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-full border-2 border-primary/30">
                  <Bell className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Aucune notification</h3>
              <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                Vous n'avez pas encore de notifications. Elles apparaîtront ici lorsqu'elles arriveront.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allNotifications.map((notification) => {
                const isFCM = 'is_fcm' in notification && notification.is_fcm;
                
                return (
                  <div
                    key={notification.id}
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                      !notification.is_read 
                        ? 'border-primary/60 bg-gradient-to-br from-primary/20 via-card/60 to-card/60 shadow-lg shadow-primary/10' 
                        : 'border-border/30 bg-card/40 backdrop-blur-md'
                    } ${isFCM ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-card/60 to-card/60' : ''}`}
                  >
                    {/* Gradient overlay for unread */}
                    {!notification.is_read && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                    )}
                    
                    <div className="relative p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon container */}
                        <div className={`shrink-0 p-2.5 rounded-xl ${
                          !notification.is_read 
                            ? 'bg-primary/20 border-2 border-primary/30' 
                            : 'bg-muted/30 border border-border/30'
                        }`}>
                          {isFCM ? (
                            <MessageSquare className={`h-5 w-5 ${!notification.is_read ? 'text-primary' : 'text-blue-500'}`} />
                          ) : (
                            <Bell className={`h-5 w-5 ${!notification.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-bold text-sm ${
                                  !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                {notification.content}
                              </p>
                            </div>
                            
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsRead(notification.id)}
                                className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 shrink-0"
                              >
                                <Check className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </span>
                            {isFCM && (
                              <>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
                                  Push
                                </Badge>
                              </>
                            )}
                            {'reference' in notification && notification.reference && (
                              <>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {notification.reference.slice(0, 12)}...
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {(hasNext || hasPrevious) && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNotifications(page - 1)}
                disabled={!hasPrevious || isLoading}
                className="bg-card/60 backdrop-blur-md border border-border/50"
              >
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNotifications(page + 1)}
                disabled={!hasNext || isLoading}
                className="bg-card/60 backdrop-blur-md border border-border/50"
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
