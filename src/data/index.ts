import buildsJson from './builds.json'
import objetsJson from './objets.json'
import sousclassesJson from './sousclasses.json'
import racesJson from './races.json'
import type { Build, Objet, RaceInfo, SousClasseInfo } from './types'

export const builds = buildsJson as Build[]
export const objets = objetsJson as Objet[]
export const sousClasses = sousclassesJson as SousClasseInfo[]
export const races = racesJson as RaceInfo[]

const objetsById = new Map(objets.map((o) => [o.id, o]))
const buildsById = new Map(builds.map((b) => [b.id, b]))

export function getBuild(id: string): Build | undefined {
  return buildsById.get(id)
}

export function getObjet(id: string): Objet | undefined {
  return objetsById.get(id)
}

export function nomAffiche(objet: Objet): string {
  return objet.nomFr ?? objet.nomEn
}

/** Un build est multi-classe dès que son split mentionne plusieurs classes séparées par "/". */
export function estMulticlasse(build: Build): boolean {
  return build.split.includes('/')
}

/** Liste des classes disponibles, dans l'ordre de première apparition des builds. */
export function classesDisponibles(): string[] {
  return [...new Set(builds.map((b) => b.classe))]
}

export function buildsPourClasse(classe: string): Build[] {
  return builds.filter((b) => b.classe === classe)
}

/** Toutes les sous-classes réelles du jeu pour une classe, qu'on ait ou non un build dessus. */
export function sousClassesPourClasse(classe: string): SousClasseInfo[] {
  return sousClasses.filter((sc) => sc.classe === classe)
}

export function buildsPourClasseEtSousClasse(classe: string, sousClasse: string): Build[] {
  return builds.filter((b) => b.classe === classe && b.sousClasse === sousClasse)
}

/** Étape de progression exacte à ce niveau, si le build en définit une. */
export function etapeAuNiveau(build: Build, niveau: number) {
  return build.progression.find((e) => e.niveau === niveau)
}

export interface BuildAlternatif {
  build: Build
  raison: string
}

/**
 * Propose des builds alternatifs au build donné : d'abord d'autres approches sur la même
 * sous-classe (playstyle différent, même identité), sinon d'autres sous-classes de la même
 * classe qui couvrent un rôle proche (jusqu'à 3, triées par recoupement de rôles).
 */
export function alternativesPourBuild(build: Build): BuildAlternatif[] {
  const memeSousClasse = builds.filter(
    (b) => b.id !== build.id && b.classe === build.classe && b.sousClasse === build.sousClasse,
  )
  if (memeSousClasse.length > 0) {
    return memeSousClasse.map((b) => ({
      build: b,
      raison: 'Autre approche sur la même sous-classe',
    }))
  }

  return builds
    .filter((b) => b.id !== build.id && b.classe === build.classe)
    .map((b) => ({ build: b, chevauchement: b.roles.filter((r) => build.roles.includes(r)).length }))
    .filter((x) => x.chevauchement > 0)
    .sort((a, b) => b.chevauchement - a.chevauchement || a.build.id.localeCompare(b.build.id))
    .slice(0, 3)
    .map((x) => ({ build: x.build, raison: `Même classe, rôle proche (${x.build.sousClasse})` }))
}

/** Builds qui recommandent cet objet, avec l'importance associée. */
export function buildsPourObjet(
  objetId: string,
): { build: Build; importance: Build['equipement'][number]['importance'] }[] {
  return builds
    .flatMap((build) =>
      build.equipement
        .filter((e) => e.objetId === objetId)
        .map((e) => ({ build, importance: e.importance })),
    )
}

export type { Build, Objet, RaceInfo, SousClasseInfo, RoleTag } from './types'
