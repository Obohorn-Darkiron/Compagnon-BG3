import type { RealtimeChannel } from '@supabase/supabase-js'
import { saveStore } from '../storage/store'
import { lireJoueurId } from '../storage/identite'
import type { Personnage } from '../storage/schema'
import { supabase } from './supabaseClient'

interface LigneSessionPersonnage {
  id: string
  session_code: string
  joueur_id: string
  data: Personnage
}

const ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O/1/I, pour éviter les confusions à l'oral

function genererCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += ALPHABET_CODE[Math.floor(Math.random() * ALPHABET_CODE.length)]
  return code
}

const canaux = new Map<string, RealtimeChannel>()
const derniereEtatPousse = new Map<string, string>()
const minuteries = new Map<string, ReturnType<typeof setTimeout>>()

async function pousserPersonnage(personnage: Personnage, sessionCode: string) {
  if (!supabase) return
  const { error } = await supabase.from('session_personnages').upsert({
    id: personnage.id,
    session_code: sessionCode,
    joueur_id: lireJoueurId(),
    data: personnage,
    updated_at: new Date().toISOString(),
  })
  if (error) console.error('Échec de synchronisation du personnage :', error.message)
}

async function supprimerPersonnageDistant(personnageId: string) {
  if (!supabase) return
  const { error } = await supabase.from('session_personnages').delete().eq('id', personnageId)
  if (error) console.error('Échec de suppression du personnage distant :', error.message)
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

// Surveille en continu la sauvegarde locale : pousse vers Supabase tout changement sur un
// personnage que ce joueur possède dans une campagne liée à une session de groupe.
saveStore.subscribe(() => {
  if (!supabase) return
  const monId = lireJoueurId()
  const data = saveStore.getSnapshot()
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
      void supprimerPersonnageDistant(id)
    }
  }
})

async function chargerPersonnagesExistants(campagneId: string, sessionCode: string) {
  if (!supabase) return
  const monId = lireJoueurId()
  const { data, error } = await supabase
    .from('session_personnages')
    .select('id, joueur_id, data')
    .eq('session_code', sessionCode)
  if (error) {
    console.error('Échec du chargement de la session :', error.message)
    return
  }
  for (const ligne of (data ?? []) as LigneSessionPersonnage[]) {
    if (ligne.joueur_id === monId) continue // déjà local, ne pas écraser mes propres données
    saveStore.appliquerPersonnageDistant(campagneId, ligne.data)
  }
}

function ecouterSession(campagneId: string, sessionCode: string) {
  if (!supabase || canaux.has(campagneId)) return
  const monId = lireJoueurId()
  const canal = supabase
    .channel(`session-${sessionCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_personnages',
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const ancienId = (payload.old as { id?: string }).id
          if (ancienId) saveStore.retirerPersonnageDistant(campagneId, ancienId)
          return
        }
        const ligne = payload.new as LigneSessionPersonnage
        if (ligne.joueur_id === monId) return // écho de mon propre push, déjà appliqué localement
        saveStore.appliquerPersonnageDistant(campagneId, ligne.data)
      },
    )
    .subscribe()
  canaux.set(campagneId, canal)
}

function arreterEcoute(campagneId: string) {
  const canal = canaux.get(campagneId)
  if (canal) {
    void canal.unsubscribe()
    canaux.delete(campagneId)
  }
}

export async function creerSession(
  campagneId: string,
): Promise<{ ok: true; code: string } | { ok: false; erreur: string }> {
  if (!supabase) return { ok: false, erreur: 'La fonction de session n’est pas encore configurée.' }
  const code = genererCode()
  const { error } = await supabase.from('sessions').insert({ code })
  if (error) return { ok: false, erreur: error.message }
  saveStore.definirSession(campagneId, code)
  ecouterSession(campagneId, code)
  return { ok: true, code }
}

export async function rejoindreSession(
  campagneId: string,
  codeSaisi: string,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!supabase) return { ok: false, erreur: 'La fonction de session n’est pas encore configurée.' }
  const code = codeSaisi.trim().toUpperCase()
  if (!code) return { ok: false, erreur: 'Entre un code de session.' }
  const { data, error } = await supabase.from('sessions').select('code').eq('code', code).maybeSingle()
  if (error) return { ok: false, erreur: error.message }
  if (!data) return { ok: false, erreur: 'Aucune session ne correspond à ce code.' }
  saveStore.definirSession(campagneId, code)
  await chargerPersonnagesExistants(campagneId, code)
  ecouterSession(campagneId, code)
  return { ok: true }
}

export function quitterSession(campagneId: string) {
  arreterEcoute(campagneId)
  saveStore.definirSession(campagneId, null)
}

/** À appeler au démarrage de l'app pour reprendre l'écoute des campagnes déjà en session. */
export function reprendreSessionsActives() {
  if (!supabase) return
  const data = saveStore.getSnapshot()
  for (const campagne of data.campagnes) {
    if (campagne.sessionCode) {
      ecouterSession(campagne.id, campagne.sessionCode)
      void chargerPersonnagesExistants(campagne.id, campagne.sessionCode)
    }
  }
}
