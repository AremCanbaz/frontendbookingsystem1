<template>
  <v-app>
    <v-container class="py-4" max-width="400">
      <v-form @submit.prevent="submitForm">
        <!-- Navn -->
        <v-text-field
          v-model="name"
          label="Dit navn"
          outlined
          dense
          required
        />

        <!-- Vælg Medarbejder -->
        <div class="my-2">
          <div class="font-weight-bold mb-2">Vælg medarbejder</div>
          <v-row dense>
            <v-col v-for="employee in employees" :key="employee.employeeId" cols="4">
              <v-card
                :elevation="selectedEmployee?.employeeId === employee.employeeId ? 10 : 2"
                @click="selectedEmployee = employee"
                class="pa-2"
                min-height="80"
                outlined
              >
                <v-avatar size="36" class="mb-2 mx-auto">
                  <img :src="employee.image" alt="medarbejder" />
                </v-avatar>
                <div class="text-center text-caption">{{ employee.name }}</div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Vælg Service -->
        <div v-if="selectedEmployee" class="my-2">
          <div class="font-weight-bold mb-2">Vælg service</div>
          <v-row dense>
            <v-col v-for="service in services" :key="service.serviceTypeId" cols="4">
              <v-card
                :elevation="selectedService?.serviceTypeId === service.serviceTypeId ? 10 : 2"
                @click="selectedService = service"
                class="pa-2"
                min-height="80"
                outlined
              >
                <v-avatar size="36" class="mb-2 mx-auto">
                  <img :src="service.image" alt="service" />
                </v-avatar>
                <div class="text-center text-caption">
                  <div>{{ service.title }}</div>
                  <div class="text-caption text-grey">{{ service.servicePrice }} kr • {{ service.estimatedTime }} min</div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Dato-vælger vises kun når medarbejder og service er valgt -->
        <div v-if="selectedEmployee && selectedService" class="my-2">
          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            max-width="290px"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="formattedDate"
                label="Vælg dato"
                readonly
                v-bind="props"
                dense
                required
              />
            </template>
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="onDateSelected"
            />
          </v-menu>
        </div>

        <!-- Tidspunkter vises kun når dato er valgt -->
        <div v-if="selectedDate" class="my-2">
          <v-select
            v-model="selectedTime"
            :items="timeOptions"
            label="Vælg tidspunkt"
            dense
            required
          />
        </div>

        <!-- Book-knap -->
        <v-btn
          v-if="selectedTime"
          type="submit"
          color="primary"
          class="mt-2"
          block
          prepend-icon="mdi-check"
        >
          Book tid
        </v-btn>
      </v-form>

      <!-- Bekræftelse -->
      <v-dialog v-model="bookingConfirmed" max-width="400">
        <v-card>
          <v-card-title class="text-h6">Booking bekræftet</v-card-title>
          <v-card-text>
            Tak {{ name }}! Din booking hos {{ selectedEmployee.name }} til
            {{ selectedService.title }} den {{ formattedDate }} kl. {{ selectedTime }} er registreret.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" @click="bookingConfirmed = false">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-app>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const name = ref('');
    const selectedEmployee = ref(null);
    const selectedService = ref(null);
    const selectedDate = ref(null);
    const selectedTime = ref(null);
    const dateMenu = ref(false);
    const bookingConfirmed = ref(false);

    const employees = ref([]);
    const services = ref([]);
    const timeOptions = [
      '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30',
    ];

    const API_URL = "http://localhost:8090";

    const loadEmployees = async () => {
      try {
        const res = await fetch(`${API_URL}/employee/allEmployees`);
        const data = await res.json();
        employees.value = data.map(employee => ({
          employeeId: employee.employeeId,
          name: employee.employeeName,
          image: employee.image || 'https://via.placeholder.com/40?text=👤',
        }));
      } catch (error) {
        console.error("Fejl ved hentning af medarbejdere:", error);
      }
    };

    const loadServices = async () => {
      try {
        const res = await fetch(`${API_URL}/serviceType/getAll`);
        const data = await res.json();
        services.value = data.map(service => ({
          serviceTypeId: service.serviceTypeId,
          title: service.serviceType,
          servicePrice: service.serviceTypePrice,
          estimatedTime: service.estimatedTimer,
          image: service.image || 'https://via.placeholder.com/40?text=💇',
        }));
      } catch (error) {
        console.error("Fejl ved hentning af services:", error);
      }
    };

    const formattedDate = computed(() => {
      if (selectedDate.value) {
        const date = new Date(selectedDate.value);
        return date.toISOString().split('T')[0];
      }
      return '';
    });

    const onDateSelected = (val) => {
      selectedDate.value = val;
      dateMenu.value = false;
    };

    const submitForm = async () => {
      const dto = {
        customerName: name.value,
        employeeId: selectedEmployee.value.employeeId,
        serviceTypeId: selectedService.value.serviceTypeId,
        salonId: 1,
        bookingdate: formattedDate.value,
        bookingtime: selectedTime.value,
      };

      try {
        const res = await fetch(`${API_URL}/bookings/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });
        await res.json();
        bookingConfirmed.value = true;
      } catch (error) {
        console.error('Fejl ved booking:', error);
      }
    };

    onMounted(() => {
      loadEmployees();
      loadServices();
    });

    return {
      name,
      selectedEmployee,
      selectedService,
      selectedDate,
      selectedTime,
      dateMenu,
      bookingConfirmed,
      employees,
      services,
      timeOptions,
      formattedDate,
      onDateSelected,
      submitForm,
    };
  },
};
</script>

<style scoped>
.pa-2 {
  padding: 6px;
}
.text-caption {
  font-size: 12px;
}
.font-weight-bold {
  font-weight: bold;
}
</style>
