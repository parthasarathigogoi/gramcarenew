let patients = [];

class Patient {
  constructor({ name, phone, symptom, triage = 'green', village }) {
    this.id = patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1;
    this.name = name;
    this.phone = phone;
    this.symptom = symptom;
    this.triage = triage;
    this.village = village;
    this.timestamp = new Date();
  }

  static find() {
    return patients;
  }

  save() {
    patients.push(this);
    return this;
  }
}

module.exports = Patient;