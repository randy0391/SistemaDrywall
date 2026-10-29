import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  ProjectType,
  WallMeasurement,
  CeilingMeasurement,
  ElectricalItem,
  MaterialPrices,
  LaborCosts,
  CrewSize,
} from '../types';
import { DEFAULT_PRICES, DEFAULT_LABOR_COSTS } from '../utils/constants';
import {
  calculateWallMaterials,
  calculateCeilingMaterials,
  calculatePaintingMaterials,
  mergeMaterials,
  calculateTotalCost,
  calculateLaborCost,
} from '../utils/calculations';
import {
  calculateElectricalMaterials,
  calculateElectricalLabor,
} from '../utils/electricalCalculations';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentElectricalProjectId: string | null;
  prices: MaterialPrices;
  laborCosts: LaborCosts;
  geminiApiKey: string;

  // Project CRUD
  createProject: (
    name: string,
    client: string,
    description: string,
    projectType?: ProjectType,
    linkedProjectId?: string
  ) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  setCurrentElectricalProject: (id: string | null) => void;
  linkProject: (sourceId: string, targetDrywallId: string) => void;
  unlinkProject: (projectId: string) => void;

  // Options & Features
  togglePaintFinishing: (enabled: boolean) => void;
  setCrewSize: (crew: CrewSize) => void;

  // Walls
  addWall: (wall: WallMeasurement) => void;
  updateWall: (wallId: string, updates: Partial<WallMeasurement>) => void;
  removeWall: (wallId: string) => void;

  // Ceilings
  addCeiling: (ceiling: CeilingMeasurement) => void;
  updateCeiling: (ceilingId: string, updates: Partial<CeilingMeasurement>) => void;
  removeCeiling: (ceilingId: string) => void;

  // Electrical Items (Separado de Drywall)
  addElectricalItem: (item: ElectricalItem, targetProjectId?: string) => void;
  updateElectricalItem: (id: string, updates: Partial<ElectricalItem>, targetProjectId?: string) => void;
  removeElectricalItem: (id: string, targetProjectId?: string) => void;

  // Sketch import
  importFromSketch: (
    walls: WallMeasurement[],
    ceilings: CeilingMeasurement[],
    sketchImage?: string,
    projectName?: string
  ) => void;

  // Prices & Labor & API Key
  updatePrices: (prices: Partial<MaterialPrices>) => void;
  updateLaborCosts: (costs: Partial<LaborCosts>) => void;
  setGeminiApiKey: (key: string) => void;

  // Calculate
  recalculate: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      currentElectricalProjectId: null,
      prices: DEFAULT_PRICES,
      laborCosts: DEFAULT_LABOR_COSTS,
      geminiApiKey: 'AIzaSyDAR9JEpDaeu2RlYun_u7HWDKawPaD0w2w',

      createProject: (name, client, description, projectType = 'drywall', linkedProjectId) => {
        const project: Project = {
          id: generateId(),
          name,
          client,
          description,
          projectType,
          linkedProjectId,
          date: new Date().toISOString().split('T')[0],
          walls: [],
          ceilings: [],
          materials: [],
          materialsCost: 0,
          laborCost: 0,
          profitAmount: 0,
          totalCost: 0,
          includePaintFinishing: false,
          crewSize: '1_maestro_1_ayudante',
          // Electrical
          electricalItems: [],
          electricalMaterials: [],
          electricalMaterialsCost: 0,
          electricalLaborCost: 0,
          electricalTotalCost: 0,
          laborSettings: get().laborCosts,
          status: 'borrador',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => {
          const nextProjects = [...state.projects, project];
          const isElectricalOnly = projectType === 'electrico';
          return {
            projects: nextProjects,
            currentProject: isElectricalOnly ? state.currentProject : project,
            currentElectricalProjectId: isElectricalOnly ? project.id : state.currentElectricalProjectId,
          };
        });

        get().recalculate();
        return project;
      },

      updateProject: (id, updates) => {
        set((state) => {
          const projects = state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          );
          const currentProject =
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
              : state.currentProject;
          return { projects, currentProject };
        });
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          currentElectricalProjectId:
            state.currentElectricalProjectId === id ? null : state.currentElectricalProjectId,
        }));
      },

      setCurrentProject: (id) => {
        set((state) => ({
          currentProject: id ? state.projects.find((p) => p.id === id) || null : null,
        }));
      },

      setCurrentElectricalProject: (id) => {
        set({ currentElectricalProjectId: id });
      },

      linkProject: (sourceId, targetDrywallId) => {
        set((state) => {
          const updated = state.projects.map((p) => {
            if (p.id === sourceId) {
              return {
                ...p,
                projectType: 'mixto' as ProjectType,
                linkedProjectId: targetDrywallId,
                updatedAt: new Date().toISOString(),
              };
            }
            if (p.id === targetDrywallId) {
              return {
                ...p,
                projectType: 'mixto' as ProjectType,
                linkedProjectId: sourceId,
                updatedAt: new Date().toISOString(),
              };
            }
            return p;
          });

          return {
            projects: updated,
            currentProject:
              state.currentProject?.id === targetDrywallId
                ? updated.find((p) => p.id === targetDrywallId) || state.currentProject
                : state.currentProject,
          };
        });
        get().recalculate();
      },

      unlinkProject: (projectId) => {
        set((state) => {
          const updated = state.projects.map((p) => {
            if (p.id === projectId || p.linkedProjectId === projectId) {
              return {
                ...p,
                linkedProjectId: undefined,
                projectType: (p.walls && p.walls.length > 0 ? 'drywall' : 'electrico') as ProjectType,
                updatedAt: new Date().toISOString(),
              };
            }
            return p;
          });
          return { projects: updated };
        });
      },

      togglePaintFinishing: (enabled) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            includePaintFinishing: enabled,
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      setCrewSize: (crew) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            crewSize: crew,
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
      },

      addWall: (wall) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            walls: [...state.currentProject.walls, wall],
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      updateWall: (wallId, updates) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            walls: state.currentProject.walls.map((w) =>
              w.id === wallId ? { ...w, ...updates } : w
            ),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      removeWall: (wallId) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            walls: state.currentProject.walls.filter((w) => w.id !== wallId),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      addCeiling: (ceiling) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            ceilings: [...state.currentProject.ceilings, ceiling],
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      updateCeiling: (ceilingId, updates) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            ceilings: state.currentProject.ceilings.map((c) =>
              c.id === ceilingId ? { ...c, ...updates } : c
            ),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      removeCeiling: (ceilingId) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            ceilings: state.currentProject.ceilings.filter((c) => c.id !== ceilingId),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      // Electrical actions with support for independent electrical project
      addElectricalItem: (item, targetProjectId) => {
        set((state) => {
          const targetId =
            targetProjectId || state.currentElectricalProjectId || state.currentProject?.id;
          if (!targetId) return state;

          const updatedProjects = state.projects.map((p) => {
            if (p.id === targetId) {
              const prevItems = p.electricalItems || [];
              return {
                ...p,
                electricalItems: [...prevItems, item],
                updatedAt: new Date().toISOString(),
              };
            }
            return p;
          });

          const currentProject =
            state.currentProject?.id === targetId
              ? updatedProjects.find((p) => p.id === targetId) || state.currentProject
              : state.currentProject;

          return {
            projects: updatedProjects,
            currentProject,
          };
        });
        get().recalculate();
      },

      updateElectricalItem: (id, updates, targetProjectId) => {
        set((state) => {
          const targetId =
            targetProjectId || state.currentElectricalProjectId || state.currentProject?.id;
          if (!targetId) return state;

          const updatedProjects = state.projects.map((p) => {
            if (p.id === targetId) {
              const prevItems = p.electricalItems || [];
              return {
                ...p,
                electricalItems: prevItems.map((it) => (it.id === id ? { ...it, ...updates } : it)),
                updatedAt: new Date().toISOString(),
              };
            }
            return p;
          });

          const currentProject =
            state.currentProject?.id === targetId
              ? updatedProjects.find((p) => p.id === targetId) || state.currentProject
              : state.currentProject;

          return {
            projects: updatedProjects,
            currentProject,
          };
        });
        get().recalculate();
      },

      removeElectricalItem: (id, targetProjectId) => {
        set((state) => {
          const targetId =
            targetProjectId || state.currentElectricalProjectId || state.currentProject?.id;
          if (!targetId) return state;

          const updatedProjects = state.projects.map((p) => {
            if (p.id === targetId) {
              const prevItems = p.electricalItems || [];
              return {
                ...p,
                electricalItems: prevItems.filter((it) => it.id !== id),
                updatedAt: new Date().toISOString(),
              };
            }
            return p;
          });

          const currentProject =
            state.currentProject?.id === targetId
              ? updatedProjects.find((p) => p.id === targetId) || state.currentProject
              : state.currentProject;

          return {
            projects: updatedProjects,
            currentProject,
          };
        });
        get().recalculate();
      },

      importFromSketch: (walls, ceilings, sketchImage, projectName) => {
        const state = get();
        if (state.currentProject) {
          const updated: Project = {
            ...state.currentProject,
            name: projectName || state.currentProject.name,
            walls: [...state.currentProject.walls, ...walls],
            ceilings: [...state.currentProject.ceilings, ...ceilings],
            sketchImage: sketchImage || state.currentProject.sketchImage,
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({
            currentProject: updated,
            projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
          }));
        } else {
          const newProj = state.createProject(
            projectName || 'Proyecto desde Dibujo IA',
            'Cliente Escaneado',
            'Detectado a partir de foto de dibujo a mano',
            'drywall'
          );
          const updated: Project = {
            ...newProj,
            walls,
            ceilings,
            sketchImage,
          };
          set((s) => ({
            currentProject: updated,
            projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
          }));
        }
        get().recalculate();
      },

      updatePrices: (newPrices) => {
        set((state) => ({
          prices: { ...state.prices, ...newPrices },
        }));
        get().recalculate();
      },

      updateLaborCosts: (newLabor) => {
        set((state) => ({
          laborCosts: { ...state.laborCosts, ...newLabor },
        }));
        get().recalculate();
      },

      setGeminiApiKey: (key) => {
        set({ geminiApiKey: key });
      },

      recalculate: () => {
        const state = get();
        const prices = state.prices;
        const labor = state.laborCosts;

        // Recalculate across all projects
        const updatedProjects = state.projects.map((proj) => {
          // Drywall calculations
          const wallMaterials = proj.walls.map((w) => calculateWallMaterials(w, prices));
          const ceilingMaterials = proj.ceilings.map((c) => calculateCeilingMaterials(c, prices));
          const paintMaterials = proj.includePaintFinishing
            ? calculatePaintingMaterials(proj.walls, proj.ceilings, prices)
            : [];

          const allMaterials = mergeMaterials([
            ...wallMaterials,
            ...ceilingMaterials,
            paintMaterials,
          ]);
          const materialsCost = calculateTotalCost(allMaterials);

          const laborResult = calculateLaborCost(
            proj.walls,
            proj.ceilings,
            labor,
            proj.includePaintFinishing
          );
          const laborCost = laborResult.totalLabor;

          const subtotal = materialsCost + laborCost;
          const profitAmount = labor.includeLabor
            ? (subtotal * (labor.profitMarginPercent || 0)) / 100
            : 0;
          const totalCost = Math.round((subtotal + profitAmount) * 100) / 100;

          // Electrical calculations (Separado)
          const electricalItems = proj.electricalItems || [];
          const electricalMaterials = calculateElectricalMaterials(electricalItems, prices);
          const electricalMaterialsCost = calculateTotalCost(electricalMaterials);
          const electricalLaborResult = calculateElectricalLabor(electricalItems, labor);
          const electricalLaborCost = electricalLaborResult.totalLabor;
          const electricalTotalCost = Math.round((electricalMaterialsCost + electricalLaborCost) * 100) / 100;

          return {
            ...proj,
            materials: allMaterials,
            materialsCost: Math.round(materialsCost * 100) / 100,
            laborCost,
            profitAmount: Math.round(profitAmount * 100) / 100,
            totalCost,
            electricalMaterials,
            electricalMaterialsCost: Math.round(electricalMaterialsCost * 100) / 100,
            electricalLaborCost,
            electricalTotalCost,
            laborSettings: labor,
          };
        });

        const currentProject = state.currentProject
          ? updatedProjects.find((p) => p.id === state.currentProject?.id) || null
          : null;

        set({
          projects: updatedProjects,
          currentProject,
        });
      },
    }),
    {
      name: 'drywall-projects-storage',
    }
  )
);
