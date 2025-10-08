const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// GET all patients
router.get('/', async (req, res) => {
  try {
    const patients = Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new patient (for testing purposes, will be replaced by actual data input)
router.post('/', async (req, res) => {
  const patient = new Patient({
    name: req.body.name,
    phone: req.body.phone,
    symptom: req.body.symptom,
    triage: req.body.triage,
    village: req.body.village,
  });

  try {
    const newPatient = patient.save();
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;