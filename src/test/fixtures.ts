import type { Build } from '../data'

/** Build minimal mais valide, pour isoler les tests de la logique de composeurEquipe/bonusPermanentsUtils. */
export function creerBuildFixture(overrides: Partial<Build> = {}): Build {
  return {
    id: 'fixture',
    classe: 'Guerrier',
    sousClasse: 'Sous-classe fixture',
    nom: 'Build fixture',
    split: 'Guerrier 12',
    role: 'Rôle fixture',
    resume: 'Résumé fixture',
    caracDepart: { FOR: 16, DEX: 14, CON: 14, INT: 8, SAG: 10, CHA: 8 },
    forces: [],
    faiblesses: [],
    dons: [],
    sortsCles: [],
    jalons: [],
    progression: [],
    equipement: [],
    roles: ['degatsMelee'],
    elements: [],
    mecaniques: [],
    ...overrides,
  }
}
