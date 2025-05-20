<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <v-row>
          <v-col
            v-for="employee in employees"
            :key="employee.id"
            cols="12"
            md="6"
          >
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const employees = ref([])
const bookings = ref([])

onMounted(async () => {
  bookings.value = (await axios.get('http://localhost:8090/bookings/getBooking/2025-0-01')).data
})


</script>
