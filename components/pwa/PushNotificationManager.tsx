// components/PushNotificationManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser } from '@/actions/notifications/push-notifications'
import { useUser } from '@clerk/nextjs'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    }
  }, [isLoaded])

  async function checkSubscription() {
    if (!isLoaded || !user) return

    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    if (!isLoaded || !user) return

    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      setSubscription(newSubscription)

      // Envoyer l'abonnement au serveur
      const serializedSub = JSON.parse(JSON.stringify(newSubscription))
      await subscribeUser(user.id, serializedSub)

      console.log('Abonnement aux notifications push réussi')
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    if (!subscription) return

    setIsLoading(true)
    try {
      await subscription.unsubscribe()
      setSubscription(null)

      // Informer le serveur du désabonnement
      await unsubscribeUser(subscription.endpoint)

      console.log('Désabonnement des notifications push réussi')
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">
          Les notifications push ne sont pas supportées par votre navigateur.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 className="text-lg font-semibold mb-2">Notifications Push</h3>
      
      {subscription ? (
        <div>
          <p className="text-green-600 mb-2">
            ✅ Vous êtes abonné aux notifications push
          </p>
          <button
            onClick={unsubscribeFromPush}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? 'Désabonnement...' : 'Se désabonner'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-2">
            Vous n'êtes pas abonné aux notifications push
          </p>
          <button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Abonnement..." : "S'abonner aux notifications"}
          </button>
        </div>
      )}
    </div>
  )
}