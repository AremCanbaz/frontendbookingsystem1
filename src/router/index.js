import { createRouter, createWebHashHistory } from 'vue-router'
import NavBar      from '@/components/NavBar.vue'
import DashBoard   from '@/views/DashBoard.vue'
import HomeView    from '@/views/HomeView.vue'
import BookingView from '@/views/BookingView.vue'
import EmployeeTab from '@/views/EmployeeTab.vue'
import LoginView   from '@/views/LoginView.vue'

const routes = [
  {
    path: '/',              // ← root layout
    component: NavBar,
    children: [
      { path: '',            redirect: 'home'      },
      { path: 'home',        name: 'home',        component: HomeView    },
      { path: 'dashboard',   name: 'dashboard',   component: DashBoard   },
      { path: 'booking',     name: 'booking',     component: BookingView },
      { path: 'employee',    name: 'employee',    component: EmployeeTab },
      // …any other admin-only pages
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
});