<template>
  <v-card class="custom-card">
    <v-card-title class="d-flex justify-between align-center">
      <span class="text-h6 font-weight-bold">Bookingoversigt</span>
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        placeholder="Søg efter kunde, salon, service..."
        density="compact"
        hide-details
        variant="outlined"
        class="search-bar"
      />
    </v-card-title>

    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="filteredItems"
      :items-length="filteredItems.length"
      :loading="loading"
      item-value="bookingId"
      :item-class="getRowClass"
      :header-props="{ class: 'table-header' }"
      class="custom-table"
      @update:options="loadItems"
    />
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const allItems = ref([])
const paginatedItems = ref([])
const totalItems = ref(0)
const itemsPerPage = ref(5)
const loading = ref(false)
const search = ref('')

const headers = ref([
  { title: 'Booking ID', key: 'bookingId' },
  { title: 'Salon', key: 'salonName' },
  { title: 'Dato', key: 'bookingDate' },
  { title: 'Tid', key: 'bookingTime' },
  { title: 'Kunde', key: 'costumerName' },
  { title: 'Medarbejder', key: 'employeeName' },
  { title: 'Service', key: 'serviceType' },
  { title: 'Pris (DKK)', key: 'serviceTypePrice', align: 'end' },
])

async function fetchBookings() {
  loading.value = true
  try {
    const res = await fetch('http://localhost:8090/bookings/getbookings')
    const data = await res.json()
    allItems.value = data
    totalItems.value = data.length
    updatePage(1)
  } catch (err) {
    console.error('Fejl ved hentning af data:', err)
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  const term = search.value.toLowerCase()
  if (!term) return paginatedItems.value

  return paginatedItems.value.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(term)
    )
  )
})

function loadItems({ page, itemsPerPage }) {
  updatePage(page, itemsPerPage)
}

function updatePage(page, perPage = itemsPerPage.value) {
  const start = (page - 1) * perPage
  const end = start + perPage
  paginatedItems.value = allItems.value.slice(start, end)
}

function getRowClass() {
  return 'row-custom'
}

onMounted(fetchBookings)
</script>

<style scoped>
/* Kort layout */
.custom-card {
  margin: 2rem auto;
  max-width: 1200px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

/* Tabel */
::v-deep(.custom-table) {
  font-size: 0.95rem;
}

/* Header */
::v-deep(.table-header) {
  background-color: #1976d2;
  color: white;
  font-weight: bold;
}

/* Rækker */
::v-deep(.row-custom:nth-child(odd)) {
  background-color: #f8f9fa;
}

::v-deep(.row-custom:nth-child(even)) {
  background-color: #ffffff;
}

::v-deep(.row-custom:hover) {
  background-color: #e0f2f1;
}

/* Søgning */
.search-bar {
  max-width: 300px;
}
</style>
