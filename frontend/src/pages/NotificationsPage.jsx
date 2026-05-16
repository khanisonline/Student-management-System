import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import StatusBadge from '../components/common/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuth, useAuthActions } from '../features/auth/useAuth';
import {
  createTestNotification,
  fetchNotifications,
  markNotificationRead,
} from '../services/notificationService';
import { formatDateTime } from '../utils/formatters';
import { useState } from 'react';

function NotificationsPage() {
  const { token } = useAuth();
  const { pushToast } = useAuthActions();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncData(() => fetchNotifications(token), [token, refreshKey]);

  async function runAction(task, message) {
    try {
      await task();
      pushToast(message, 'success');
      setRefreshKey((value) => value + 1);
    } catch (actionError) {
      pushToast(actionError.message, 'danger');
    }
  }

  if (loading) {
    return <LoadingState label="Loading notifications..." />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Notifications"
        title="Alerts and updates"
        description={error || 'Read notifications from the backend and mark them as seen.'}
        actions={
          <button type="button" className="primary-button" onClick={() => runAction(() => createTestNotification(token), 'Test notification created.')}>
            Create test notification
          </button>
        }
      />

      <Panel eyebrow="Inbox" title="Recent notifications">
        {!data?.notifications?.length ? (
          <EmptyState title="No notifications yet" message="Use the test action above or trigger backend events." />
        ) : (
          <div className="list-grid">
            {data.notifications.map((notification) => (
              <div key={notification._id} className="list-card">
                <div>
                  <strong>{notification.message}</strong>
                  <p className="muted">{formatDateTime(notification.createdAt)}</p>
                </div>
                <div className="button-row">
                  <StatusBadge tone={notification.isRead ? 'success' : 'warning'}>
                    {notification.isRead ? 'Read' : notification.type || 'Unread'}
                  </StatusBadge>
                  {!notification.isRead ? (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => runAction(() => markNotificationRead(token, notification._id), 'Notification marked as read.')}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export default NotificationsPage;
