import {
  get,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  type Unsubscribe,
} from 'firebase/database'
import { saveStore } from '../storage/store'
import { lireJoueurId } from '../storage/identite'
import type { Personnage } from '../storage/schema'
import { database } from './firebaseClient'

interface LignePersonnage {
  joueurId: string
  data: Personnage
}

const ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O/1/I, pour éviter les confusions à l'oral

function genererCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += ALPHABET_CODE[Math.floor(Math.random() * ALPHABET_CODE.length)]
  return code
}

const ecoutes = new Map<string, Unsubscribe[]>()
const derniereEtatPousse = new Map<string, string>()
const minuteries = new Map<string, ReturnType<typeof setTimeout>>()

async function pousserPersonnage(personnage: Personnage, sessionCode: string) {
  if (!database) return
  try {
    await set(ref(database, `sessions/${sessionCode}/personnages/${personnage.id}`), {
      joueurId: lireJoueurId(),
      data: personnage,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error('Échec de synchronisation du personnage :', err)
  }
}

async function supprimerPersonnageDistant(personnageId: string, sessionCode: string) {
  if (!database) return
  try {
    await remove(ref(database, `sessions/${sessionCode}/personnages/${personnageId}`))
  } catch (err) {
    console.error('Échec de suppression du personnage distant :', err)
  }
}

function planifierPush(personnage: Personnage, sessionCode: string) {
  const existante = minuteries.get(personnage.id)
  if (existante) clearTimeout(existante)
  minuteries.set(
    personnage.id,
    setTimeout(() => {
      minuteries.delete(personnage.id)
      void pousserPersonnage(personnage, sessionCode)
    }, 600),
  )
}

// Surveille en continu la sauvegarde locale : pousse vers Firebase tout changement sur un
// personnage que ce joueur possède dans une campagne liée à une session de groupe.
saveStore.subscribe(() => {
  if (!database) return
  const monId = lireJoueurId()
  const data = saveStore.getSnapshot()
  const codesSessionsActives = data.campagnes.map((c) => c.sessionCode).filter((c): c is string => c !== null)
  const idsVus = new Set<string>()
  for (const campagne of data.campagnes) {
    if (!campagne.sessionCode) continue
    for (const perso of campagne.personnages) {
      if (perso.proprietaireId !== monId) continue
      idsVus.add(perso.id)
      const empreinte = JSON.stringify(perso)
      if (derniereEtatPousse.get(perso.id) === empreinte) continue
      derniereEtatPousse.set(perso.id, empreinte)
      planifierPush(perso, campagne.sessionCode)
    }
  }
  // Un personnage possédé qui a disparu localement (suppression) : on le retire aussi côté serveur.
  for (const id of [...derniereEtatPousse.keys()]) {
    if (!idsVus.has(id)) {
      derniereEtatPousse.delete(id)
      for (const code of codesSessionsActives) void supprimerPersonnageDistant(id, code)
    }
  }
})

function ecouterSession(campagneId: string, sessionCode: string) {
  if (!database || ecoutes.has(campagneId)) return
  const monId = lireJoueurId()
  const cheminPersonnages = ref(database, `sessions/${sessionCode}/personnages`)

  // onChildAdded rejoue automatiquement tous les personnages déjà présents au moment de
  // l'abonnement, puis chaque nouvel ajout — inutile de faire un chargement initial séparé.
  const arreterAjout = onChildAdded(cheminPersonnages, (snap) => {
    const ligne = snap.val() as LignePersonnage
    if (ligne.joueurId === monId) return
    saveStore.appliquerPersonnageDistant(campagneId, ligne.data)
  })
  const arreterModif = onChildChanged(cheminPersonnages, (snap) => {
    const ligne = snap.val() as LignePersonnage
    if (ligne.joueurId === monId) return
    saveStore.appliquerPersonnageDistant(campagneId, ligne.data)
  })
  const arreterRetrait = onChildRemoved(cheminPersonnages, (snap) => {
    if (snap.key) saveStore.retirerPersonnageDistant(campagneId, snap.key)
  })

  // Si la session disparaît côté serveur (le propriétaire l'a supprimée, ou le dernier joueur
  // vient de la vider), on se détache localement au lieu de rester connecté dans le vide.
  let premierAppel = true
  const arreterSurveillanceSession = onValue(ref(database, `sessions/${sessionCode}/creeLe`), (snap) => {
    if (premierAppel) {
      premierAppel = false
      return
    }
    if (!snap.exists()) {
      arreterEcoute(campagneId)
      saveStore.definirSession(campagneId, null)
    }
  })

  ecoutes.set(campagneId, [arreterAjout, arreterModif, arreterRetrait, arreterSurveillanceSession])
}

function arreterEcoute(campagneId: string) {
  const fns = ecoutes.get(campagneId)
  if (fns) {
    fns.forEach((fn) => fn())
    ecoutes.delete(campagneId)
  }
}

export async function creerSession(
  campagneId: string,
): Promise<{ ok: true; code: string } | { ok: false; erreur: string }> {
  if (!database) return { ok: false, erreur: 'La fonction de session n’est pas encore configurée.' }
  const code = genererCode()
  try {
    await set(ref(database, `sessions/${code}/creeLe`), serverTimestamp())
    await set(ref(database, `sessions/${code}/creePar`), lireJoueurId())
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
  }
  saveStore.definirSession(campagneId, code, true)
  ecouterSession(campagneId, code)
  return { ok: true, code }
}

export async function rejoindreSession(
  campagneId: string,
  codeSaisi: string,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!database) return { ok: false, erreur: 'La fonction de session n’est pas encore configurée.' }
  const code = codeSaisi.trim().toUpperCase()
  if (!code) return { ok: false, erreur: 'Entre un code de session.' }
  let existe = false
  let creePar: string | null = null
  try {
    const [snapshotCreeLe, snapshotCreePar] = await Promise.all([
      get(ref(database, `sessions/${code}/creeLe`)),
      get(ref(database, `sessions/${code}/creePar`)),
    ])
    existe = snapshotCreeLe.exists()
    creePar = snapshotCreePar.val()
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
  }
  if (!existe) return { ok: false, erreur: 'Aucune session ne correspond à ce code.' }
  // Si cette personne avait créé la session à l'origine (même appareil, même joueurId) et la
  // rejoint après l'avoir quittée (reset, campagne supprimée...), elle retrouve son statut de
  // créateur au lieu de perdre silencieusement le bouton "Supprimer pour tout le monde".
  saveStore.definirSession(campagneId, code, creePar === lireJoueurId())
  ecouterSession(campagneId, code)
  return { ok: true }
}

/** Quitte la session : retire mes personnages côté serveur, et supprime la session entière si
 * plus personne n'y a de personnage (dernier joueur parti = plus rien à synchroniser). */
export async function quitterSession(campagneId: string) {
  const monId = lireJoueurId()
  const campagne = saveStore.getSnapshot().campagnes.find((c) => c.id === campagneId)
  const sessionCode = campagne?.sessionCode

  arreterEcoute(campagneId)
  saveStore.definirSession(campagneId, null)

  const db = database
  if (!db || !sessionCode) return
  try {
    const mesPersonnages = campagne?.personnages.filter((p) => p.proprietaireId === monId) ?? []
    await Promise.all(mesPersonnages.map((p) => remove(ref(db, `sessions/${sessionCode}/personnages/${p.id}`))))
    const restants = await get(ref(db, `sessions/${sessionCode}/personnages`))
    if (!restants.exists()) await remove(ref(db, `sessions/${sessionCode}`))
  } catch (err) {
    console.error('Échec du nettoyage de session en quittant :', err)
  }
}

/** Réservé au créateur de la session : la supprime pour tout le monde (personnages de tous les
 * joueurs compris), pas seulement pour soi. */
export async function supprimerSessionEtQuitter(
  campagneId: string,
  sessionCode: string,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  arreterEcoute(campagneId)
  saveStore.definirSession(campagneId, null)
  if (!database) return { ok: true }
  try {
    await remove(ref(database, `sessions/${sessionCode}`))
    return { ok: true }
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
  }
}

/** À appeler au démarrage de l'app pour reprendre l'écoute des campagnes déjà en session. */
export function reprendreSessionsActives() {
  if (!database) return
  const data = saveStore.getSnapshot()
  for (const campagne of data.campagnes) {
    if (campagne.sessionCode) ecouterSession(campagne.id, campagne.sessionCode)
  }
}

/**
 * À appeler AVANT toute suppression locale (réinitialisation complète, suppression d'une
 * campagne) qui efface une campagne liée à une session de groupe. Sans ça, l'état local disparaît
 * avant que la session ait pu être quittée proprement : le personnage reste orphelin pour
 * toujours côté Firebase, visible indéfiniment par les autres joueurs comme un profil qui ne se
 * met plus jamais à jour.
 */
export async function quitterSessionsPourCampagnes(campagneIds: string[]) {
  for (const campagneId of campagneIds) {
    await quitterSession(campagneId)
  }
}
