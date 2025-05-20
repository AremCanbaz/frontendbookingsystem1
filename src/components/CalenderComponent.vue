<template>
  <v-container>
    <!-- Date navigation -->
    <v-row align="center" class="mb-4">
      <v-col cols="2">
        <v-btn icon @click="prevDay">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="8" class="text-center">
        <h2 class="text-h6 font-weight-medium">
          Bookings for {{ displayDate }}
        </h2>
      </v-col>
      <v-col cols="2" class="text-right">
        <v-btn icon @click="nextDay">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Employee columns -->
    <v-row>
      <v-col
        v-for="emp in bookingsData"
        :key="emp.employeeId"
        cols="12"
        md="4"
      >
        <v-card>
          <v-card-title class="align-center">
            <v-avatar size="40">
              <v-img :src="emp.image" />
            </v-avatar>
            <span class="ml-3">{{ emp.employeeName }}</span>
          </v-card-title>

          <v-card-text class="position-relative" style="height: 600px;">
            <div
              v-for="slot in slots"
              :key="slot.toISOString()"
              class="position-absolute w-100 px-1"
              :style="slotStyle(slot)"
            >
              <v-btn
                block
                small
                :color="isBooked(emp, slot) ? 'red lighten-2' : 'green lighten-2'"
                @click="onSlotClick(emp, slot)"
              >
                {{ formatTime(slot) }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Booking Details Dialog -->
    <v-dialog v-model="detailDialog" max-width="400">
      <v-card>
        <v-card-title>Booking Details</v-card-title>
        <v-card-text v-if="activeBooking">
          <p><strong>Employee:</strong> {{ activeBooking.emp.employeeName }}</p>
          <p><strong>Customer:</strong> {{ activeBooking.customerName }}</p>
          <p>
            <strong>Service:</strong>
            {{ activeBooking.serviceName }}
            ({{ activeBooking.servicePrice }} DKK)
          </p>
          <p>
            <strong>Time:</strong>
            {{ formatTime(new Date(activeBooking.startTime)) }}
            – {{ formatTime(new Date(activeBooking.endTime)) }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="detailDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- New Booking Dialog -->
    <v-dialog v-model="newDialog" max-width="600">
      <v-card>
        <v-card-title>New Booking</v-card-title>
        <v-card-text>
          <p><strong>Employee:</strong> {{ pending.emp.employeeName }}</p>
          <p><strong>Time:</strong> {{ formatTime(pending.time) }}</p>

          <!-- Service selection -->
          <v-row>
            <v-col
              v-for="svc in serviceOptions"
              :key="svc.serviceTypeId"
              cols="12"
              md="6"
            >
              <v-card
                :outlined="svc.serviceTypeId !== formData.serviceTypeId"
                :elevation="svc.serviceTypeId === formData.serviceTypeId ? 4 : 1"
                class="ma-2"
                @click="selectService(svc)"
              >
                <v-card-title>{{ svc.serviceType }}</v-card-title>
                <v-card-subtitle>
                  {{ svc.serviceTypePrice }} DKK &middot;
                  {{ svc.estimatedTimer }} min
                </v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>

          <!-- Customer form -->
          <v-form ref="form">
            <v-text-field
              v-model="formData.name"
              label="Customer Name"
              required
            />
            <v-text-field
              v-model="formData.email"
              label="Email"
              required
            />
            <v-text-field
              v-model="formData.phone"
              label="Phone"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="newDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createBooking">
            Create Booking
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="500">
      <v-card>
        <v-card-title>Booking Successful</v-card-title>
        <v-card-text v-if="successResponse">
          <pre>{{ successResponse }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="successDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const START_HOUR   = 8
const END_HOUR     = 18
const SLOT_MINUTES = 30

// dialogs & form state
const detailDialog    = ref(false)
const newDialog       = ref(false)
const successDialog   = ref(false)
const activeBooking   = ref(null)
const pending         = ref({ emp: null, time: null })
const successResponse = ref(null)
// form fields
const formData        = ref({ name: '', email: '', phone: '', serviceTypeId: null })

// data fetched from backend
const bookingsData    = ref([])
const serviceOptions  = ref([])

// selected date, defaults to today
const selectedDate    = ref(new Date())

// computed for API and display
const stringDate = computed(() => selectedDate.value.toISOString().slice(0, 10))
const displayDate = computed(() => selectedDate.value.toLocaleDateString())

// fetch bookings whenever the date changes
const fetchBookings = async () => {
  try {
    const res = await axios.get(
      `http://localhost:8090/bookings/getBooking/1/${stringDate.value}`
    )
    bookingsData.value = res.data
  } catch (err) {
    console.error('Failed to load bookings:', err)
  }
}

onMounted(fetchBookings)
watch(stringDate, fetchBookings)

// build time slots
const slots = computed(() => {
  const arr = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const dt = new Date(selectedDate.value)
      dt.setHours(h, m, 0, 0)
      arr.push(dt)
    }
  }
  return arr
})

// helpers
const formatTime = dt => dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const isBooked = (emp, slot) =>
  emp.bookingList.some(b => {
    const start = new Date(b.startTime).getTime()
    const end   = new Date(b.endTime).getTime()
    return slot.getTime() >= start && slot.getTime() <= end
  })
const getBooking = (emp, slot) =>
  emp.bookingList.find(b => {
    const start = new Date(b.startTime).getTime()
    const end   = new Date(b.endTime).getTime()
    return slot.getTime() >= start && slot.getTime() <= end
  })
const slotStyle = slot => {
  const total = END_HOUR - START_HOUR
  const top   = ((slot.getHours() + slot.getMinutes()/60 - START_HOUR) / total) * 100
  const height = (SLOT_MINUTES / (total*60)) * 100
  return { top: `${top}%`, height: `${height}%` }
}

// on slot click
const onSlotClick = async (emp, slot) => {
  const booking = getBooking(emp, slot)
  if (booking) {
    activeBooking.value = {
      emp,
      customerName: booking.costumerName,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice,
      startTime: booking.startTime,
      endTime: booking.endTime
    }
    detailDialog.value = true
  } else {
    try {
      const res = await axios.get(
        `http://localhost:8090/serviceType/employee/${emp.employeeId}`
      )
      serviceOptions.value = res.data
    } catch (err) {
      console.error('Failed to load services:', err)
    }
    pending.value      = { emp, time: slot }
    formData.value     = { name: '', email: '', phone: '', serviceTypeId: null }
    newDialog.value    = true
  }
}

// select a service card
const selectService = svc => {
  formData.value.serviceTypeId = svc.serviceTypeId
}

// create booking matches backend DTO
const createBooking = async () => {
  if (!formData.value.serviceTypeId) return alert('Select a service')
  try {
    const res = await axios.post('http://localhost:8090/bookings/create', {
      employeeId:             pending.value.emp.employeeId,
      serviceTypeId:          formData.value.serviceTypeId,
      customerName:           formData.value.name,
      customerEmail:          formData.value.email,
      customerPhoneNumber:    formData.value.phone,
      salonId:                1,
      bookingdate:            stringDate.value,
      bookingtime:            pending.value.time.toTimeString().slice(0,5)
    })
    successResponse.value = res.data
    newDialog.value = false
    successDialog.value = true
    fetchBookings()
  } catch (err) {
    console.error('Failed to create booking:', err)
  }
}

// day navigation
const prevDay = () => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() - 1)
  selectedDate.value = d
}
const nextDay = () => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + 1)
  selectedDate.value = d
}
</script>

<style scoped>
.position-relative { position: relative; }
.position-absolute { position: absolute; }
</style>
