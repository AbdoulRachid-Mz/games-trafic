"use client"

import { Typography } from '@/components/ui/typography'
import { useAuthContext } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Unlock, Eye, EyeOff, Shield, CreditCard, DollarSign, History, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getCurrentUserWallet, updateUserWallet, verifyWalletPin, toggleWalletLock } from '@/actions/wallets'
import { UserWallet } from '@/database/schema'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const WalletSettingsPage = () => {
  const { user, loading } = useAuthContext()
  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [showPin, setShowPin] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [updatingPin, setUpdatingPin] = useState(false)
  const [updatingLock, setUpdatingLock] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadWallet()
  }, [])

  const loadWallet = async () => {
    try {
      setLoadingWallet(true)
      const userWallet = await getCurrentUserWallet()
      setWallet(userWallet)
    } catch (error) {
      console.error('Error loading wallet:', error)
      toast.error('Erreur lors du chargement du wallet')
    } finally {
      setLoadingWallet(false)
    }
  }

  const handlePinUpdate = async () => {
    if (!wallet) return

    if (newPin.length < 4) {
      toast.error('Le PIN doit contenir au moins 4 chiffres')
      return
    }

    if (newPin !== confirmPin) {
      toast.error('Les nouveaux PIN ne correspondent pas')
      return
    }

    try {
      setUpdatingPin(true)

      // Verify current PIN first
      const verification = await verifyWalletPin(wallet.id, currentPin)
      if (!verification.success) {
        toast.error(verification.error || 'PIN actuel incorrect')
        return
      }

      // Update PIN (you'll need to implement this function)
      const updatedWallet = await updateUserWallet(wallet.id, {
        pinHash: newPin // In real app, hash this
      })

      setWallet(updatedWallet)
      toast.success('PIN mis à jour avec succès')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (error) {
      console.error('Error updating PIN:', error)
      toast.error('Erreur lors de la mise à jour du PIN')
    } finally {
      setUpdatingPin(false)
    }
  }

  const handleLockToggle = async () => {
    if (!wallet) return

    try {
      setUpdatingLock(true)
      const updatedWallet = await toggleWalletLock(wallet.id, !wallet.isLocked)
      setWallet(updatedWallet)
      toast.success(updatedWallet.isLocked ? 'Wallet verrouillé' : 'Wallet déverrouillé')
    } catch (error) {
      console.error('Error toggling lock:', error)
      toast.error('Erreur lors du verrouillage du wallet')
    } finally {
      setUpdatingLock(false)
    }
  }

  if (loading || loadingWallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertDescription>
            Vous n'avez pas encore créé de wallet. Veuillez créer un wallet pour accéder aux paramètres.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (wallet.isLocked) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h2" className="text-2xl font-bold">Paramètres du Wallet</Typography>
            <Typography variant="muted" className="text-sm">Gérez les paramètres de sécurité et de confidentialité</Typography>
          </div>
          <Badge variant={wallet.isActive ? "default" : "destructive"}>
            {wallet.isActive ? "Actif" : "Inactif"}
          </Badge>
        </div>

        <Card className="p-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Wallet verrouillé
            </CardTitle>
            <CardDescription>
              Votre wallet est actuellement verrouillé. Vous pouvez deposer une reclamation ou retourner.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            {/* <Button onClick={handleLockToggle} disabled={updatingLock}>
              {updatingLock && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Déverrouiller le wallet
            </Button> */}
            <Button variant="outline" onClick={() => router.push("/wallet/claims")}>
              Reclamation
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto p-3 max-w-4xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="text-2xl font-bold">Paramètres du Wallet</Typography>
          <Typography variant="muted" className="text-sm">Gérez les paramètres de sécurité et de confidentialité</Typography>
        </div>
        <Badge variant={wallet.isActive ? "default" : "destructive"}>
          {wallet.isActive ? "Actif" : "Inactif"}
        </Badge>
      </div>

      {/* Balance Card */}
      <Card className="p-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Solde actuel</CardTitle>
          GTC
        </CardHeader>
        <CardContent>
          {/* <div className="text-2xl font-bold">{wallet.} GTC</div> */}
          <p className="text-xs text-muted-foreground">
            Card #: ****{wallet.cardNumberHash?.slice(-4)}
          </p>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="p-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>Protégez votre wallet avec des paramètres de sécurité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="wallet-lock">Verrouiller le wallet</Label>
              <p className="text-sm text-muted-foreground">
                Empêche toutes les transactions
              </p>
            </div>
            <Switch
              id="wallet-lock"
              checked={wallet.isLocked ?? undefined}
              onCheckedChange={handleLockToggle}
              disabled={updatingLock}
            />
          </div>

          <Separator /> */}

          {/* PIN Change */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pin">PIN actuel</Label>
              <div className="relative">
                <Input
                  id="current-pin"
                  type={showPin ? "text" : "password"}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="Entrez votre PIN actuel"
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-pin">Nouveau PIN</Label>
                <Input
                  id="new-pin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Nouveau PIN"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirmer PIN</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirmer PIN"
                  maxLength={6}
                />
              </div>
            </div>

            <Button
              onClick={handlePinUpdate}
              disabled={updatingPin || !currentPin || !newPin || !confirmPin}
              className="w-full"
            >
              {updatingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour le PIN
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="p-3">
        <CardHeader>
          <CardTitle>Vérification d'identité</CardTitle>
          <CardDescription>Statut de vérification de votre wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Statut actuel</p>
              <Badge variant={
                wallet.verificationStatus === 'VERIFIED' ? "default" :
                  wallet.verificationStatus === 'PENDING' ? "outline" : "secondary"
              }>
                {wallet.verificationStatus === 'VERIFIED' ? 'Vérifié' :
                  wallet.verificationStatus === 'PENDING' ? 'En attente' : 'Non vérifié'}
              </Badge>
            </div>
            {wallet.verificationStatus !== 'VERIFIED' && (
              <Button size="sm">
                {wallet.verificationStatus === 'PENDING' ? 'Compléter la vérification' : 'Commencer la vérification'}
              </Button>
            )}
          </div>
          {wallet.verifiedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Vérifié le {new Date(wallet.verifiedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default WalletSettingsPage