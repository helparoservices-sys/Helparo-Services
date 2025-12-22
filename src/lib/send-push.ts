/**
 * Send push notification to a user
 * Call this from server-side code (API routes, server actions)
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body?: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'
    
    const response = await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, data })
    })

    if (!response.ok) {
      console.error('Push notification failed:', await response.text())
      return { sent: 0, failed: 1 }
    }

    return await response.json()
  } catch (error) {
    console.error('Push notification error:', error)
    return { sent: 0, failed: 1 }
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToMultipleUsers(
  userIds: string[],
  title: string,
  body?: string,
  data?: Record<string, string>
): Promise<{ totalSent: number; totalFailed: number }> {
  const results = await Promise.all(
    userIds.map(userId => sendPushNotification(userId, title, body, data))
  )

  return {
    totalSent: results.reduce((sum, r) => sum + r.sent, 0),
    totalFailed: results.reduce((sum, r) => sum + r.failed, 0)
  }
}
