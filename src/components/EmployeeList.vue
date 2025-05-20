<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <h1 class="mb-4">Medarbejdere</h1>
        <v-btn color="primary" @click="openCreate">Opret medarbejder</v-btn>
      </v-col>

      <v-col cols="12" sm="4" v-for="employee in employees" :key="employee.employeeId">
        <v-card class="hoverable" @click="openEdit(employee.employeeId)">
          <v-img :src="employee.employeeImage || placeholderImage" height="200px"></v-img>
          <v-card-title>{{ employee.employeeName }}</v-card-title>
          <v-card-subtitle>{{ employee.employeeEmail }}</v-card-subtitle>
          <v-card-actions>
            <v-btn color="error" @click.stop="deleteEmployee(employee.employeeId)">Slet</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="800">
      <v-card>
        <v-card-title>{{ form.employeeId ? 'Rediger' : 'Opret' }} medarbejder</v-card-title>
        <v-card-text>
          <v-form ref="employeeForm">
            <v-text-field v-model="form.employeeName" label="Navn" :rules="[v => !!v || 'Navn påkrævet']"></v-text-field>
            <v-text-field v-model="form.employeeEmail" label="Email" :rules="[v => !!v || 'Email påkrævet']"></v-text-field>
            <v-text-field v-model="form.employeeNumber" label="Telefon" :rules="[v => !!v || 'Telefon påkrævet']"></v-text-field>

            <h3 class="mt-4">Ugentlig arbejdstid</h3>
            <v-row dense v-for="dag in ugedage" :key="dag.value">
              <v-col cols="4">
                <v-checkbox v-model="form.weeklyAvailabilityDays" :label="dag.label" :value="dag.value"></v-checkbox>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  type="time"
                  :label="'Åbning ' + dag.label"
                  v-model="getOrCreateAvailability(dag.value).startTime"
                  :disabled="!form.weeklyAvailabilityDays.includes(dag.value)"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  type="time"
                  :label="'Lukning ' + dag.label"
                  v-model="getOrCreateAvailability(dag.value).endTime"
                  :disabled="!form.weeklyAvailabilityDays.includes(dag.value)"
                ></v-text-field>
              </v-col>
            </v-row>

            <h3 class="mt-4">Dage fri</h3>
            <v-text-field v-model="newDayOff" label="Tilføj dag (YYYY-MM-DD)" @keydown.enter="addDayOff"></v-text-field>
            <v-chip v-for="d in form.dayOffs" :key="d.day" class="ma-2" closable @click:close="removeDayOff(d.day)">
              {{ d.day }}
            </v-chip>

            <h3 class="mt-4">Services</h3>
            <v-checkbox v-for="s in services" :key="s.serviceTypeId" :label="s.serviceType" :value="s.serviceTypeId" v-model="form.serviceIds"></v-checkbox>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" @click="save">Gem</v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="dialog = false">Luk</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';

const toast = useToast();

const employees = ref([]);
const services = ref([]);
const dialog = ref(false);
const employeeForm = ref(null);

const placeholderImage = 'https://via.placeholder.com/200';
const newDayOff = ref('');

const ugedage = [
  { value: 1, label: 'Mandag' },
  { value: 2, label: 'Tirsdag' },
  { value: 3, label: 'Onsdag' },
  { value: 4, label: 'Torsdag' },
  { value: 5, label: 'Fredag' },
  { value: 6, label: 'Lørdag' },
  { value: 7, label: 'Søndag' }
];

const form = ref(resetForm());

onMounted(() => {
  fetchEmployees();
  fetchServices();
});

function resetForm() {
  return {
    employeeId: null,
    employeeName: '',
    employeeEmail: '',
    employeeNumber: '',
    weeklyAvailability: ugedage.map(day => ({ weekDay: day.value, startTime: '09:00', endTime: '17:00' })),
    dayOffs: [],
    serviceIds: [],
    weeklyAvailabilityDays: []
  };
}

async function fetchEmployees() {
  const res = await axios.get('http://localhost:8090/employees/allEmployees');
  employees.value = res.data;
  console.log('Fetched employees:', employees.value);
}

async function fetchServices() {
  const res = await axios.get('http://localhost:8090/serviceType/getAll');
  services.value = res.data;
}

async function openEdit(id) {
  const res = await axios.get(`http://localhost:8090/employee/${id}`);
  const data = res.data;
  form.value = {
    ...data,
    weeklyAvailabilityDays: data.weeklyAvailability.map(w => w.weekDay),
    weeklyAvailability: data.weeklyAvailability
  };
  dialog.value = true;
}

function openCreate() {
  form.value = resetForm();
  dialog.value = true;
}

function getOrCreateAvailability(day) {
  if (!form.value.weeklyAvailability) form.value.weeklyAvailability = [];
  let avail = form.value.weeklyAvailability.find(w => w.weekDay === day);
  if (!avail) {
    avail = { weekDay: day, startTime: '09:00', endTime: '17:00' };
    form.value.weeklyAvailability.push(avail);
  }
  return avail;
}

function addDayOff() {
  if (newDayOff.value) {
    form.value.dayOffs.push({ day: newDayOff.value });
    newDayOff.value = '';
  }
}

function removeDayOff(day) {
  form.value.dayOffs = form.value.dayOffs.filter(d => d.day !== day);
}

async function save() {
  const valid = await validateForm();
  if (!valid) {
    toast.error('Udfyld venligst alle felter korrekt!');
    return;
  }
  try {
    form.value.weeklyAvailability = form.value.weeklyAvailability.filter(w => form.value.weeklyAvailabilityDays.includes(w.weekDay));
    form.value.salonId = 1;
    await axios.post('http://localhost:8090/employee/save', form.value);
    toast.success('Medarbejder gemt!');
    dialog.value = false;
    fetchEmployees();
  } catch (error) {
    toast.error('Fejl ved gemning!');
    console.error(error);
  }
}

async function deleteEmployee(id) {
  if (confirm('Er du sikker på at du vil slette medarbejderen?')) {
    await axios.delete(`http://localhost:8090/employee/${id}`);
    toast.success('Medarbejder slettet!');
    fetchEmployees();
  }
}

async function validateForm() {
  const formRef = employeeForm.value;
  if (!formRef) return false;
  const { valid } = await formRef.validate();
  return valid;
}
</script>
