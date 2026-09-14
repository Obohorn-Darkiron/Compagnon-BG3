import { onDisconnect, onValue, ref, remove, set } from 'firebase/database'
import { useEffect, useState } from 'react'
import { lireJoueurId } from '../storage/identite'
import { database } from './firebaseClient'

let minuterie: ReturnType<typeof setTimeout> | null = null
let disconnectArmePour: string | null = null

function armerNettoyageDeconnexion(sessionCode: string) {
  if (!database || disconnectArmePour === sessionCode) return
  const monId = lireJoueurId()
  void onDisconnect(ref(database, `sessions/${sessionCode}/enTrain/${monId}`)).remove()
  disconnectArmePour = sessionCode
}

/**
 * Signale (débattu, ~400ms) ce que je suis en train de regarder/choisir dans le lobby — pour que
 * les autres joueurs le voient en direct avant même que j'aie créé mon personnage. Purement
 * éphémère : jamais stocké dans la sauvegarde locale ni dans le state React persistant, et nettoyé
 * automatiquement si l'onglet se ferme brutalement (onDisconnect) — pas grave si ça rate, ça
 * n'affiche qu'un indicateur de présence, aucune vraie donnée en jeu.
 */
export function definirEnTrainDeChoisir(sessionCode: string, texte: string | null) {
  if (!database) return
  armerNettoyageDeconnexion(sessionCode)
  if (minuterie) clearTimeout(minuterie)
  minuterie = setTimeout(() => {
    minuterie = null
    if (!database) return
    const monId = lireJoueurId()
    const chemin = ref(database, `sessions/${sessionCode}/enTrain/${monId}`)
    if (texte) void set(chemin, texte)
    else void remove(chemin)
  }, 400)
}

/** Efface immédiatement (sans débounce) — à utiliser quand on quitte le formulaire de création. */
export function effacerEnTrainDeChoisir(sessionCode: string) {
  if (!database) return
  if (minuterie) {
    clearTimeout(minuterie)
    minuterie = null
  }
  const monId = lireJoueurId()
  void remove(ref(database, `sessions/${sessionCode}/enTrain/${monId}`))
}

/** Roster en direct de "qui regarde quoi" (joueurId -> texte), pour affichage dans le lobby. */
export function useEnTrainDeChoisir(sessionCode: string | null): Record<string, string> {
  const [etat, setEtat] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!database || !sessionCode) {
      setEtat({})
      return
    }
    const chemin = ref(database, `sessions/${sessionCode}/enTrain`)
    const arreter = onValue(chemin, (snap) => {
      setEtat((snap.val() ?? {}) as Record<string, string>)
    })
    return () => arreter()
  }, [sessionCode])

  return etat
}
