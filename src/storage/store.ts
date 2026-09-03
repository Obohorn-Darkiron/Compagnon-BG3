import { ecrireBrut, lireBrut } from './driver'
import { lireJoueurId } from './identite'
import { SAVE_VERSION, saveDataVide, type Campagne, type Personnage, type SaveData } from './schema'

function normaliserPersonnage(p: Partial<Personnage>): Personnage {
  return {
    id: p.id ?? crypto.randomUUID(),
    nom: p.nom ?? '',
    classe: p.classe ?? null,
    sousClasse: p.sousClasse ?? null,
    buildId: p.buildId ?? null,
    race: p.race ?? null,
    sousRace: p.sousRace ?? null,
    styleJeu: p.styleJeu ?? null,
    niveau: p.niveau ?? 1,
    objetsObtenus: p.objetsObtenus ?? [],
    choixBonusPermanents: p.choixBonusPermanents ?? {},
    compagnonNom: p.compagnonNom ?? null,
    proprietaireId: p.proprietaireId ?? null,
    estDarkUrge: p.estDarkUrge ?? false,
    jalonsSombresCoches: p.jalonsSombresCoches ?? [],
  }
}

function normaliserCampagne(c: Partial<Campagne>): Campagne {
  return {
    id: c.id ?? crypto.randomUUID(),
    nom: c.nom ?? '',
    personnages: (c.personnages ?? []).map(normaliserPersonnage),
    compagnonsRecrutes: c.compagnonsRecrutes ?? [],
    sessionCode: c.sessionCode ?? null,
    sessionEstProprietaire: c.sessionEstProprietaire ?? false,
  }
}

function migrer(data: unknown): SaveData {
  if (
    data &&
    typeof data === 'object' &&
    'saveVersion' in data &&
    'campagnes' in data
  ) {
    const brut = data as SaveData
    return {
      ...brut,
      campagnes: brut.campagnes.map(normaliserCampagne),
    }
  }
  return saveDataVide()
}

function charger(): SaveData {
  const brut = lireBrut()
  if (!brut) return saveDataVide()
  try {
    return migrer(JSON.parse(brut))
  } catch {
    return saveDataVide()
  }
}

let etat: SaveData = charger()
const abonnes = new Set<() => void>()

function notifier() {
  ecrireBrut(JSON.stringify(etat))
  abonnes.forEach((fn) => fn())
}

function majEtat(nouveau: SaveData) {
  etat = nouveau
  notifier()
}

function idAleatoire(): string {
  return crypto.randomUUID()
}

export const saveStore = {
  subscribe(fn: () => void) {
    abonnes.add(fn)
    return () => abonnes.delete(fn)
  },

  getSnapshot(): SaveData {
    return etat
  },

  creerCampagne(nom: string): string {
    const campagne: Campagne = {
      id: idAleatoire(),
      nom,
      personnages: [],
      compagnonsRecrutes: [],
      sessionCode: null,
      sessionEstProprietaire: false,
    }
    majEtat({
      ...etat,
      campagnes: [...etat.campagnes, campagne],
      campagneActiveId: etat.campagneActiveId ?? campagne.id,
    })
    return campagne.id
  },

  definirCampagneActive(campagneId: string) {
    majEtat({ ...etat, campagneActiveId: campagneId })
  },

  supprimerCampagne(campagneId: string) {
    const campagnes = etat.campagnes.filter((c) => c.id !== campagneId)
    majEtat({
      ...etat,
      campagnes,
      campagneActiveId:
        etat.campagneActiveId === campagneId
          ? (campagnes[0]?.id ?? null)
          : etat.campagneActiveId,
    })
  },

  creerPersonnage(
    campagneId: string,
    nom: string,
    infos: {
      classe?: string | null
      sousClasse?: string | null
      buildId?: string | null
      race?: string | null
      sousRace?: string | null
      styleJeu?: Personnage['styleJeu']
      compagnonNom?: string | null
    } = {},
  ): string {
    const campagneCible = etat.campagnes.find((c) => c.id === campagneId)
    const personnage: Personnage = {
      id: idAleatoire(),
      nom,
      classe: infos.classe ?? null,
      sousClasse: infos.sousClasse ?? null,
      buildId: infos.buildId ?? null,
      race: infos.race ?? null,
      sousRace: infos.sousRace ?? null,
      styleJeu: infos.styleJeu ?? null,
      niveau: 1,
      objetsObtenus: [],
      choixBonusPermanents: {},
      compagnonNom: infos.compagnonNom ?? null,
      proprietaireId: campagneCible?.sessionCode ? lireJoueurId() : null,
      estDarkUrge: false,
      jalonsSombresCoches: [],
    }
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) => {
        if (c.id !== campagneId) return c
        const compagnonsRecrutes =
          personnage.compagnonNom && !c.compagnonsRecrutes.includes(personnage.compagnonNom)
            ? [...c.compagnonsRecrutes, personnage.compagnonNom]
            : c.compagnonsRecrutes
        return { ...c, personnages: [...c.personnages, personnage], compagnonsRecrutes }
      }),
    })
    return personnage.id
  },

  supprimerPersonnage(campagneId: string, personnageId: string) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) =>
        c.id === campagneId
          ? { ...c, personnages: c.personnages.filter((p) => p.id !== personnageId) }
          : c,
      ),
    })
  },

  majPersonnage(
    campagneId: string,
    personnageId: string,
    patch: Partial<
      Pick<
        Personnage,
        | 'nom'
        | 'classe'
        | 'sousClasse'
        | 'buildId'
        | 'race'
        | 'sousRace'
        | 'styleJeu'
        | 'niveau'
        | 'estDarkUrge'
      >
    >,
  ) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) =>
        c.id === campagneId
          ? {
              ...c,
              personnages: c.personnages.map((p) =>
                p.id === personnageId ? { ...p, ...patch } : p,
              ),
            }
          : c,
      ),
    })
  },

  definirChoixBonusPermanent(
    campagneId: string,
    personnageId: string,
    objetId: string,
    choix: { stat?: string; valeur?: number },
  ) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) =>
        c.id === campagneId
          ? {
              ...c,
              personnages: c.personnages.map((p) => {
                if (p.id !== personnageId) return p
                const existant = p.choixBonusPermanents[objetId] ?? { stat: '', valeur: 1 }
                return {
                  ...p,
                  choixBonusPermanents: {
                    ...p.choixBonusPermanents,
                    [objetId]: { ...existant, ...choix },
                  },
                }
              }),
            }
          : c,
      ),
    })
  },

  basculerObjetObtenu(campagneId: string, personnageId: string, objetId: string) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) =>
        c.id === campagneId
          ? {
              ...c,
              personnages: c.personnages.map((p) => {
                if (p.id !== personnageId) return p
                const deja = p.objetsObtenus.includes(objetId)
                return {
                  ...p,
                  objetsObtenus: deja
                    ? p.objetsObtenus.filter((id) => id !== objetId)
                    : [...p.objetsObtenus, objetId],
                }
              }),
            }
          : c,
      ),
    })
  },

  basculerJalonSombre(campagneId: string, personnageId: string, jalonId: string) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) =>
        c.id === campagneId
          ? {
              ...c,
              personnages: c.personnages.map((p) => {
                if (p.id !== personnageId) return p
                const deja = p.jalonsSombresCoches.includes(jalonId)
                return {
                  ...p,
                  jalonsSombresCoches: deja
                    ? p.jalonsSombresCoches.filter((id) => id !== jalonId)
                    : [...p.jalonsSombresCoches, jalonId],
                }
              }),
            }
          : c,
      ),
    })
  },

  basculerCompagnonRecrute(campagneId: string, nomCompagnon: string) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) => {
        if (c.id !== campagneId) return c
        const deja = c.compagnonsRecrutes.includes(nomCompagnon)
        return {
          ...c,
          compagnonsRecrutes: deja
            ? c.compagnonsRecrutes.filter((n) => n !== nomCompagnon)
            : [...c.compagnonsRecrutes, nomCompagnon],
        }
      }),
    })
  },

  /** Associe (ou retire, avec code=null) une campagne à une session de groupe partagée.
   * Quitter une session détache les personnages des autres joueurs (ils ne sont plus synchronisés). */
  definirSession(campagneId: string, code: string | null, estProprietaire = false) {
    const monId = lireJoueurId()
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) => {
        if (c.id !== campagneId) return c
        if (code !== null) {
          return {
            ...c,
            sessionCode: code,
            sessionEstProprietaire: estProprietaire,
            // Les personnages déjà présents avant la session deviennent les miens (synchronisés).
            personnages: c.personnages.map((p) =>
              p.proprietaireId === null ? { ...p, proprietaireId: monId } : p,
            ),
          }
        }
        return {
          ...c,
          sessionCode: null,
          sessionEstProprietaire: false,
          personnages: c.personnages.filter((p) => p.proprietaireId === null || p.proprietaireId === monId),
        }
      }),
    })
  },

  /** Insère ou met à jour un personnage reçu d'un autre joueur de la session (ne touche jamais aux miens). */
  appliquerPersonnageDistant(campagneId: string, personnage: Personnage) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) => {
        if (c.id !== campagneId) return c
        const dejaPresent = c.personnages.some((p) => p.id === personnage.id)
        return {
          ...c,
          personnages: dejaPresent
            ? c.personnages.map((p) => (p.id === personnage.id ? personnage : p))
            : [...c.personnages, personnage],
        }
      }),
    })
  },

  /** Retire un personnage supprimé par son propriétaire ailleurs dans la session. */
  retirerPersonnageDistant(campagneId: string, personnageId: string) {
    majEtat({
      ...etat,
      campagnes: etat.campagnes.map((c) =>
        c.id === campagneId
          ? { ...c, personnages: c.personnages.filter((p) => p.id !== personnageId) }
          : c,
      ),
    })
  },

  exporterJson(): string {
    return JSON.stringify(etat, null, 2)
  },

  importerJson(json: string): { ok: true } | { ok: false; erreur: string } {
    try {
      const data = JSON.parse(json)
      if (!data || typeof data !== 'object' || !('campagnes' in data)) {
        return { ok: false, erreur: 'Ce fichier ne ressemble pas à une sauvegarde valide.' }
      }
      majEtat(migrer(data))
      return { ok: true }
    } catch {
      return { ok: false, erreur: 'Fichier JSON illisible.' }
    }
  },

  reinitialiser() {
    majEtat(saveDataVide())
  },
}

export { SAVE_VERSION }
