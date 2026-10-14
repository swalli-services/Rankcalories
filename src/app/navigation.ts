import {
  LayoutDashboard,
  Calculator,
  ChartNoAxesCombined,
  Settings,
} from 'lucide-react'
import type { NavigationItem } from '../types/navigation'

export const navigation: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    title: 'Tu objetivo, día a día',
    icon: LayoutDashboard,
  },
  {
    path: '/calories',
    label: 'Calculadora de calorías',
    title: 'Calculadora de calorías',
    icon: Calculator,
  },
  {
    path: '/statistics',
    label: 'Gráficas y estadísticas',
    title: 'Gráficas y estadísticas',
    icon: ChartNoAxesCombined,
  },
  {
    path: '/settings',
    label: 'Configuración',
    title: 'Configuración',
    icon: Settings,
  },
]
