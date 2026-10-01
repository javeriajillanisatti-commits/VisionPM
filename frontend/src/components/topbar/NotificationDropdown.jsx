import React, { useCallback, useEffect, useState } from "react"; 
import { 
  FileText, 
  Clock, 
  RefreshCw, 
  Bell, 
  Check, 
  CheckCheck, 
  Inbox, 
  ArrowRight, 
} from "lucide-react"; 
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
} from "../../services/notificationService"; 
 
const NotificationDropdown = ({ 
  onClose, 
  onUnreadCountChange, 
  onNotificationClick, 
  notificationTypes, 
}) => { 
  const [notifications, setNotifications] = useState([]); 
  const [loading, setLoading] = useState(true); 
 
  const filterNotifications = useCallback( 
    list => { 
      if (!Array.isArray(notificationTypes) || !notificationTypes.length) { 
        return list; 
      } 
 
      return list.filter(notification => 
        notificationTypes.includes(notification.type) 
      ); 
    }, 
    [notificationTypes] 
  ); 
 
  useEffect(() => { 
    const fetchNotifications = async () => { 
      try { 
        const data = await getMyNotifications(); 
        const list = filterNotifications(data?.notifications || []); 
 
        setNotifications(list); 
        onUnreadCountChange?.( 
          list.filter(notification => !notification.isRead).length 
        ); 
      } catch (error) { 
        console.error("Error fetching notifications:", error); 
        setNotifications([]); 
        onUnreadCountChange?.(0); 
      } finally { 
        setLoading(false); 
      } 
    }; 
 
    fetchNotifications(); 
  }, [filterNotifications, onUnreadCountChange]); 
 
  const markAsRead = async id => { 
    if (!id) return; 
 
    const previous = notifications; 
 
    const updated = notifications.map(notification => 
      notification._id === id 
        ? { ...notification, isRead: true } 
        : notification 
    ); 
 
    setNotifications(updated); 
    onUnreadCountChange?.( 
      updated.filter(notification => !notification.isRead).length 
    ); 
 
    try { 
      await markNotificationAsRead(id); 
    } catch (error) { 
      console.error("Error marking notification as read:", error); 
      setNotifications(previous); 
      onUnreadCountChange?.( 
        previous.filter(notification => !notification.isRead).length 
      ); 
    } 
  }; 
 
  const markAllAsRead = async () => { 
    const previous = notifications; 
    const updated = notifications.map(notification => ({ 
      ...notification, 
      isRead: true, 
    })); 
 
    setNotifications(updated); 
    onUnreadCountChange?.(0); 
 
    try { 
      await markAllNotificationsAsRead(); 
    } catch (error) { 
      console.error( 
        "Error marking all notifications as read:", 
        error 
      ); 
 
      setNotifications(previous); 
      onUnreadCountChange?.( 
        previous.filter(notification => !notification.isRead).length 
      ); 
    } 
  }; 
 
  const getIcon = type => { 
    const icons = { 
      TASK_ASSIGNED: FileText, 
      SUBTASK_ASSIGNED: FileText, 
      SUBTASK_COMPLETED: CheckCheck, 
      TASK_MEMBER_COMPLETED: Check, 
      STATUS_UPDATED: RefreshCw, 
      DEADLINE: Clock, 
    }; 
 
    const Icon = icons[type] || Bell; 
 
    return <Icon size={17} strokeWidth={2} />; 
  }; 
 
  const getColor = type => 
    ({ 
      TASK_ASSIGNED: { 
        iconBg: "bg-indigo-50 dark:bg-indigo-500/10", 
        iconText: "text-indigo-600 dark:text-indigo-400", 
        accent: "bg-indigo-500", 
        dot: "bg-indigo-500", 
      }, 
 
      SUBTASK_ASSIGNED: { 
        iconBg: "bg-indigo-50 dark:bg-indigo-500/10", 
        iconText: "text-indigo-600 dark:text-indigo-400", 
        accent: "bg-indigo-500", 
        dot: "bg-indigo-500", 
      }, 
 
      SUBTASK_COMPLETED: { 
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10", 
        iconText: "text-emerald-600 dark:text-emerald-400", 
        accent: "bg-emerald-500", 
        dot: "bg-emerald-500", 
      }, 
 
      TASK_MEMBER_COMPLETED: { 
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10", 
        iconText: "text-emerald-600 dark:text-emerald-400", 
        accent: "bg-emerald-500", 
        dot: "bg-emerald-500", 
      }, 
 
      STATUS_UPDATED: { 
        iconBg: "bg-blue-50 dark:bg-blue-500/10", 
        iconText: "text-blue-600 dark:text-blue-400", 
        accent: "bg-blue-500", 
        dot: "bg-blue-500", 
      }, 
 
      DEADLINE: { 
        iconBg: "bg-amber-50 dark:bg-amber-500/10", 
        iconText: "text-amber-600 dark:text-amber-400", 
        accent: "bg-amber-500", 
        dot: "bg-amber-500", 
      }, 
 
    }[type] || { 
      iconBg: "bg-slate-100 dark:bg-slate-800", 
      iconText: "text-slate-500 dark:text-slate-400", 
      accent: "bg-slate-400", 
      dot: "bg-slate-400", 
    }); 
 
  const formatTimeAgo = dateStr => { 
    if (!dateStr) return ""; 
 
    const date = new Date(dateStr); 
 
    if (Number.isNaN(date.getTime())) return ""; 
 
    const seconds = Math.floor((new Date() - date) / 1000); 
 
    if (seconds < 60) return "Just now"; 
 
    const minutes = Math.floor(seconds / 60); 
 
    if (minutes < 60) { 
      return `${minutes}m ago`; 
    } 
 
    const hours = Math.floor(minutes / 60); 
 
    if (hours < 24) { 
      return `${hours}h ago`; 
    } 
 
    const days = Math.floor(hours / 24); 
 
    if (days < 7) { 
      return `${days}d ago`; 
    } 
 
    const weeks = Math.floor(days / 7); 
 
    if (weeks < 5) { 
      return `${weeks}w ago`; 
    } 
 
    return date.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric", 
    }); 
  }; 
 
  const unreadCount = notifications.filter( 
    notification => !notification.isRead 
  ).length; 
 
  const handleNotificationClick = async notification => { 
    if (!notification?._id) return; 
 
    if (!notification.isRead) { 
      await markAsRead(notification._id); 
    } 
 
    onNotificationClick?.(notification); 
  }; 
 
  const handleViewAll = () => onClose?.(); 
 
  return ( 
    <div className="absolute right-0 mt-3 w-[calc(100vw-24px)] max-w-[400px] min-w-0 sm:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden z-50"> 
      {/* Header */} 
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800"> 
        <div className="flex items-center justify-between gap-2 sm:gap-3"> 
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0"> 
            <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200"> 
              <Bell size={18} /> 
            </div> 
 
            <div className="min-w-0"> 
              <div className="flex items-center gap-2"> 
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate"> 
                  Notifications 
                </h3> 
 
                {unreadCount > 0 && ( 
                  <span className="min-w-[22px] h-[20px] px-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0"> 
                    {unreadCount} 
                  </span> 
                )} 
              </div> 
 
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate"> 
                {unreadCount 
                  ? `${unreadCount} unread notification${ 
                      unreadCount > 1 ? "s" : "" 
                    }` 
                  : "You're all caught up"} 
              </p> 
            </div> 
          </div> 
 
          {unreadCount > 0 && ( 
            <button 
              type="button" 
              onClick={markAllAsRead} 
              className="shrink-0 flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all whitespace-nowrap" 
            > 
              <CheckCheck size={14} /> 
 
              <span className="hidden xs:inline sm:inline"> 
                Mark all read 
              </span> 
 
              <span className="xs:hidden"> 
                Read all 
              </span> 
            </button> 
          )} 
        </div> 
      </div> 
 
      {/* Notification list */} 
      <div className="max-h-[60vh] sm:max-h-[390px] overflow-y-auto"> 
        {loading ? ( 
          <div className="px-4 sm:px-5 py-10 sm:py-12 text-center"> 
            <div className="mx-auto mb-3 h-9 w-9 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 animate-spin" /> 
 
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400"> 
              Loading notifications... 
            </p> 
          </div> 
        ) : notifications.length ? ( 
          <div> 
            {notifications.map(notification => { 
              const color = getColor(notification.type); 
 
              return ( 
                <button 
                  type="button" 
                  key={notification._id} 
                  onClick={() => handleNotificationClick(notification)} 
                  className={`relative w-full text-left flex gap-2.5 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 transition-all duration-200 group ${ 
                    notification.isRead 
                      ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60" 
                      : "bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-800/60" 
                  }`} 
                > 
                  {!notification.isRead && ( 
                    <span 
                      className={`absolute left-0 top-0 bottom-0 w-[3px] ${color.accent}`} 
                    /> 
                  )} 
 
                  <div 
                    className={`shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-xl ${color.iconBg} ${color.iconText} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`} 
                  > 
                    {getIcon(notification.type)} 
                  </div> 
 
                  <div className="min-w-0 flex-1 pt-0.5"> 
                    <p 
                      className={`text-[12px] sm:text-[13px] leading-[1.45] pr-1 break-words overflow-wrap-anywhere ${ 
                        notification.isRead 
                          ? "text-slate-500 dark:text-slate-400 font-normal" 
                          : "text-slate-800 dark:text-slate-100 font-semibold" 
                      }`} 
                    > 
                      {notification.message} 
                    </p> 
 
                    <div className="flex items-center flex-wrap gap-2 mt-2"> 
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap"> 
                        {formatTimeAgo(notification.createdAt)} 
                      </span> 
 
                      {!notification.isRead && ( 
                        <> 
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" /> 
 
                          <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 whitespace-nowrap"> 
                            New 
                          </span> 
                        </> 
                      )} 
                    </div> 
 
                    {notification.type === "ANNOUNCEMENT" && 
                      notification.attachmentName && 
                      notification.attachmentUrl && ( 
                        <div className="flex items-center gap-2 mt-2 min-w-0"> 
                          <FileText 
                            size={13} 
                            className="shrink-0 text-purple-500 dark:text-purple-400" 
                          /> 
 
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate"> 
                            {notification.attachmentName} 
                          </span> 
                        </div> 
                      )} 
                  </div> 
 
                  <div className="shrink-0 self-center"> 
                    {!notification.isRead ? ( 
                      <span 
                        className={`block h-2 w-2 rounded-full ${color.dot} ring-4 ring-white dark:ring-slate-900`} 
                      /> 
                    ) : ( 
                      <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"> 
                        <Check 
                          size={11} 
                          className="text-slate-400 dark:text-slate-500" 
                        /> 
                      </div> 
                    )} 
                  </div> 
                </button> 
              ); 
            })} 
          </div> 
        ) : ( 
          <div className="px-4 sm:px-5 py-12 sm:py-14 text-center"> 
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500"> 
              <Inbox size={22} /> 
            </div> 
 
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200"> 
              No notifications 
            </h4> 
 
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1"> 
              You're all caught up for now. 
            </p> 
          </div> 
        )} 
      </div> 
 
      {/* Footer */} 
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900"> 
        <button 
          type="button" 
          onClick={handleViewAll} 
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm border border-blue-500 text-xs font-semibold hover:from-blue-700 hover:to-blue-600 hover:shadow-md active:scale-[0.99] transition-all duration-200" 
        > 
          <span>View all notifications</span> 
          <ArrowRight size={14} /> 
        </button> 
      </div> 
    </div> 
  ); 
}; 
 
export default NotificationDropdown;