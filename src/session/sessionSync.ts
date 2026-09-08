import {
  get,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  type Unsubscribe,
} from 'firebase/database'
import { saveStore } from '../storage/store'
import { lireJoueurId } from '../storage/identite'
import type { JoueurSession, Personnage } from '../storage/schema'
import { database } from './firebaseClient'

interface LignePersonnage {
  joueurId: string
  data: Personnage
}

/** Forme stockée sous sessions/{code}/joueurs/{joueurId} — la clé porte déjà le joueurId, pas
 * besoin de le répéter dans la valeur. */
type EntreeJoueur = Pick<JoueurSession, 'numero' | 'nom' | 'pret'>

const ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O/1/I, pour éviter les confusions à l'oral

function genererCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += ALPHABET_CODE[Math.floor(Math.random() * ALPHABET_CODE.length)]
  return code
}

const ecoutes = new Map<string, Unsubscribe[]>()
const derniereEtatPousse = new Map<string, string>()
const minuteries = new Map<string, ReturnType<typeof setTimeout>>()
const derniereEtatJoueurPousse = new Map<string, string>()
const minuteriesJoueur = new Map<string, ReturnType<typeof setTimeout>>()

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

async function pousserJoueur(joueur: JoueurSession, sessionCode: string) {
  if (!database) return
  try {
    const entree: EntreeJoueur = { numero: joueur.numero, nom: joueur.nom, pret: joueur.pret }
    await set(ref(database, `sessions/${sessionCode}/joueurs/${joueur.joueurId}`), entree)
  } catch (err) {
    console.error('Échec de synchronisation du joueur :', err)
  }
}

function planifierPushJoueur(joueur: JoueurSession, sessionCode: string) {
  const existante = minuteriesJoueur.get(joueur.joueurId)
  if (existante) clearTimeout(existante)
  minuteriesJoueur.set(
    joueur.joueurId,
    setTimeout(() => {
      minuteriesJoueur.delete(joueur.joueurId)
      void pousserJoueur(joueur, sessionCode)
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

  // Même logique pour ma propre entrée du roster (nom, prêt) — une par campagne en session.
  for (const campagne of data.campagnes) {
    if (!campagne.sessionCode) continue
    const monJoueur = campagne.sessionJoueurs.find((j) => j.joueurId === monId)
    if (!monJoueur) continue
    const empreinte = JSON.stringify(monJoueur)
    if (derniereEtatJoueurPousse.get(campagne.id) === empreinte) continue
    derniereEtatJoueurPousse.set(campagne.id, empreinte)
    planifierPushJoueur(monJoueur, campagne.sessionCode)
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

  // Roster des joueurs (numéro, nom, prêt) — même schéma d'écoute que les personnages.
  const cheminJoueurs = ref(database, `sessions/${sessionCode}/joueurs`)
  const arreterJoueurAjout = onChildAdded(cheminJoueurs, (snap) => {
    if (!snap.key || snap.key === monId) return
    const entree = snap.val() as EntreeJoueur
    saveStore.appliquerJoueurSession(campagneId, { joueurId: snap.key, ...entree })
  })
  const arreterJoueurModif = onChildChanged(cheminJoueurs, (snap) => {
    if (!snap.key || snap.key === monId) return
    const entree = snap.val() as EntreeJoueur
    saveStore.appliquerJoueurSession(campagneId, { joueurId: snap.key, ...entree })
  })
  const arreterJoueurRetrait = onChildRemoved(cheminJoueurs, (snap) => {
    if (snap.key) saveStore.retirerJoueurSession(campagneId, snap.key)
  })

  // Taille max et confirmation du groupe — absentes (snap vide) pour une session créée avant
  // l'ajout du lobby : on retombe alors sur le comportement d'avant (pas de lobby).
  const arreterTailleMax = onValue(ref(database, `sessions/${sessionCode}/tailleMax`), (snap) => {
    saveStore.definirSessionTailleMax(campagneId, snap.exists() ? (snap.val() as number) : null)
  })
  const arreterConfirmee = onValue(ref(database, `sessions/${sessionCode}/confirmee`), (snap) => {
    saveStore.definirSessionConfirmee(campagneId, snap.exists() ? Boolean(snap.val()) : false)
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

  ecoutes.set(campagneId, [
    arreterAjout,
    arreterModif,
    arreterRetrait,
    arreterJoueurAjout,
    arreterJoueurModif,
    arreterJoueurRetrait,
    arreterTailleMax,
    arreterConfirmee,
    arreterSurveillanceSession,
  ])
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
  tailleMax: number,
  monNom: string,
): Promise<{ ok: true; code: string } | { ok: false; erreur: string }> {
  if (!database) return { ok: false, erreur: 'La fonction de session n’est pas encore configurée.' }
  const code = genererCode()
  const monId = lireJoueurId()
  const nom = monNom.trim() || 'Joueur 1'
  try {
    await set(ref(database, `sessions/${code}/creeLe`), serverTimestamp())
    await set(ref(database, `sessions/${code}/creePar`), monId)
    await set(ref(database, `sessions/${code}/tailleMax`), tailleMax)
    await set(ref(database, `sessions/${code}/confirmee`), false)
    const entree: EntreeJoueur = { numero: 1, nom, pret: false }
    await set(ref(database, `sessions/${code}/joueurs/${monId}`), entree)
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
  }
  saveStore.definirSession(campagneId, code, true)
  saveStore.definirSessionTailleMax(campagneId, tailleMax)
  saveStore.appliquerJoueurSession(campagneId, { joueurId: monId, numero: 1, nom, pret: false })
  ecouterSession(campagneId, code)
  return { ok: true, code }
}

export async function rejoindreSession(
  campagneId: string,
  codeSaisi: string,
  monNom: string,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!database) return { ok: false, erreur: 'La fonction de session n’est pas encore configurée.' }
  const code = codeSaisi.trim().toUpperCase()
  if (!code) return { ok: false, erreur: 'Entre un code de session.' }
  let existe = false
  let creePar: string | null = null
  let tailleMax: number | null = null
  try {
    const [snapshotCreeLe, snapshotCreePar, snapshotTailleMax] = await Promise.all([
      get(ref(database, `sessions/${code}/creeLe`)),
      get(ref(database, `sessions/${code}/creePar`)),
      get(ref(database, `sessions/${code}/tailleMax`)),
    ])
    existe = snapshotCreeLe.exists()
    creePar = snapshotCreePar.val()
    tailleMax = snapshotTailleMax.exists() ? (snapshotTailleMax.val() as number) : null
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
  }
  if (!existe) return { ok: false, erreur: 'Aucune session ne correspond à ce code.' }
  const monId = lireJoueurId()
  const nom = monNom.trim()

  // Réserve un numéro de joueur libre (1..tailleMax) via une transaction, pour éviter que deux
  // personnes qui rejoignent en même temps prennent le même numéro. Sessions créées avant l'ajout
  // du lobby (tailleMax absent) : pas de roster à tenir, on saute cette étape.
  if (tailleMax !== null) {
    let erreurSlot: string | null = null
    try {
      await runTransaction(ref(database, `sessions/${code}/joueurs`), (actuel) => {
        const map = (actuel ?? {}) as Record<string, EntreeJoueur>
        const dejaPresent = map[monId]
        if (dejaPresent) {
          // Reconnexion (même appareil) : garde le numéro déjà attribué, met juste le nom à jour.
          map[monId] = { ...dejaPresent, nom: nom || dejaPresent.nom }
          return map
        }
        const numerosOccupes = new Set(Object.values(map).map((j) => j.numero))
        let libre: number | null = null
        for (let n = 1; n <= tailleMax!; n++) {
          if (!numerosOccupes.has(n)) {
            libre = n
            break
          }
        }
        if (libre === null) {
          erreurSlot = 'Cette session est déjà complète.'
          return undefined // abandonne la transaction
        }
        map[monId] = { numero: libre, nom: nom || `Joueur ${libre}`, pret: false }
        return map
      })
    } catch (err) {
      return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
    }
    if (erreurSlot) return { ok: false, erreur: erreurSlot }
  }

  // Si cette personne avait créé la session à l'origine (même appareil, même joueurId) et la
  // rejoint après l'avoir quittée (reset, campagne supprimée...), elle retrouve son statut de
  // créateur au lieu de perdre silencieusement le bouton "Supprimer pour tout le monde".
  saveStore.definirSession(campagneId, code, creePar === monId)
  saveStore.definirSessionTailleMax(campagneId, tailleMax)

  // Si mon (mes) personnage(s) existent déjà dans cette session — par exemple après un reset
  // local ou un changement d'appareil — on les récupère au lieu de repartir de zéro comme si je
  // n'avais jamais joué. Même chose pour tout le roster de joueurs déjà présent.
  if (database) {
    try {
      const [snapshotPersonnages, snapshotJoueurs] = await Promise.all([
        get(ref(database, `sessions/${code}/personnages`)),
        get(ref(database, `sessions/${code}/joueurs`)),
      ])
      snapshotPersonnages.forEach((enfant) => {
        const ligne = enfant.val() as LignePersonnage
        if (ligne.joueurId === monId) saveStore.appliquerPersonnageDistant(campagneId, ligne.data)
      })
      snapshotJoueurs.forEach((enfant) => {
        if (!enfant.key) return
        const entree = enfant.val() as EntreeJoueur
        saveStore.appliquerJoueurSession(campagneId, { joueurId: enfant.key, ...entree })
      })
    } catch (err) {
      console.error('Échec de la récupération des données déjà présentes :', err)
    }
  }

  ecouterSession(campagneId, code)
  return { ok: true }
}

/** Réservé au créateur de la session côté UI (voir SessionLobby) : marque le groupe confirmé.
 * Rien n'est verrouillé pour autant — les builds restent modifiables ensuite, le panneau de
 * synergies/conflits continue de se recalculer en direct. */
export async function confirmerGroupe(
  campagneId: string,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const campagne = saveStore.getSnapshot().campagnes.find((c) => c.id === campagneId)
  const sessionCode = campagne?.sessionCode
  if (!database || !sessionCode) return { ok: false, erreur: 'Session introuvable.' }
  try {
    await set(ref(database, `sessions/${sessionCode}/confirmee`), true)
    saveStore.definirSessionConfirmee(campagneId, true)
    return { ok: true }
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
  }
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
    await remove(ref(db, `sessions/${sessionCode}/joueurs/${monId}`))
    const restants = await get(ref(db, `sessions/${sessionCode}/personnages`))
    if (!restants.exists()) await remove(ref(db, `sessions/${sessionCode}`))
  } catch (err) {
    console.error('Échec du nettoyage de session en quittant :', err)
  }
}

/**
 * Retire UN personnage précis d'une session (un coéquipier, en pratique). Réservé au créateur de
 * la session côté UI (voir EquipePage) — sans compte utilisateur, rien n'empêche techniquement un
 * autre membre d'appeler cette fonction, mais l'appli ne propose ce geste qu'au créateur. Supprime
 * aussi la session entière si c'était le dernier personnage qui y restait.
 */
export async function retirerPersonnageDeSession(
  campagneId: string,
  sessionCode: string,
  personnageId: string,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!database) return { ok: false, erreur: 'La fonction de session n’est pas encore configurée.' }
  try {
    await remove(ref(database, `sessions/${sessionCode}/personnages/${personnageId}`))
    saveStore.retirerPersonnageDistant(campagneId, personnageId)
    const restants = await get(ref(database, `sessions/${sessionCode}/personnages`))
    if (!restants.exists()) await remove(ref(database, `sessions/${sessionCode}`))
    return { ok: true }
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : 'Erreur inconnue.' }
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
 * Détache une campagne de sa session UNIQUEMENT en local (arrête d'écouter, oublie le code) —
 * ne touche jamais aux données Firebase. Pour "Réinitialiser mes données" ou "Supprimer cette
 * campagne" : ce ne sont pas des actions "je quitte le groupe", ça peut être un simple ménage
 * local (téléphone changé, appli buggée...). Le personnage reste visible pour les autres joueurs
 * — récupérable en revenant avec le même code, ou supprimable par n'importe quel membre via
 * retirerPersonnageDeSession si la personne ne revient pas.
 */
function detacherSessionLocalement(campagneId: string) {
  arreterEcoute(campagneId)
  saveStore.definirSession(campagneId, null)
}

/** À appeler AVANT toute réinitialisation ou suppression de campagne locale, pour chaque
 * campagne concernée — voir detacherSessionLocalement. */
export function detacherSessionsPourCampagnes(campagneIds: string[]) {
  for (const campagneId of campagneIds) detacherSessionLocalement(campagneId)
}
