#!/bin/bash

cat \
  ../docs/js/kidney/blood-type.js \
  ../docs/js/kidney/donor-patient.js \
  ../docs/js/kidney/generated-dataset.js \
  ../docs/js/kidney/generator.js \
  ../docs/js/kidney/pra-band.js \
  ../docs/js/kidney/tuning.js \
  ../docs/js/kidney/compat-band.js \
  generate.js \
  | grep -v "Constructed a KidneyGenerator" \
  > combined-kidney.js
