'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clickNumber = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
   this.type === 'running' ? this.description = `Jogging ${new Intl.DateTimeFormat('en-En').format(this.date)}` : this.description = `Cycling ${new Intl.DateTimeFormat('en-En').format(this.date)}`;
  }

  click () {
    this.clickNumber ++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }

  calculatePace() {
    // min/km
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed() {
    // km/h
    this.speed = this.distance / this.duration / 60;
  }
}

class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
      // Get the user's location
      this._getPosition();

      // Getting data from local storage
      this._getLocalStorageData();

      // Add event handlers
      form.addEventListener('submit', this._newWorkout.bind(this));
      inputType.addEventListener('change', this._toggleClimbField);
      containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition (
                this._loadMap.bind(this), 
                function() {
                    alert("App can't find your location")
                }
            );
        }
    }

    _loadMap(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        //   const {latitude, longitude} = position.coords;

        const coords = [latitude, longitude]
            
        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Processing a click on the map
        this.#map.on('click', this._showForm.bind(this));

        // Display workouts from local storage on the map
        this.#workouts.forEach(workout => {
          this._displayWorkout(workout);
        });
    }

    _showForm(event) {
        this.#mapEvent = event;
            form.classList.remove('hidden');
            inputDistance.focus();
    }

    _hideForm() {
      inputDistance.value = inputDuration.value = inputTemp.value = inputClimb.value = '';
      form.classList.add('hidden')
    }

    _toggleClimbField() {
        inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
        inputTemp.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(event) {
        const areNumbers = (...numbers) =>
          numbers.every(num => Number.isFinite(num));

        const areNumbersPositive = (...numbers) => numbers.every(num => num > 0);

        event.preventDefault();

        const lat = this.#mapEvent.latlng.lat;
        const lng = this.#mapEvent.latlng.lng;
        /* const {lat, lng} = mapEvent.latLng; */
        let workout;

        //_____ Get data from form_____
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        //_____If the workout is a run, create a Running object_____
        if (type === 'running') {
            const temp = +inputTemp.value;
            // Check data valid
            if (!areNumbers(distance, duration, temp) || !areNumbersPositive(distance, duration, temp))
            return alert('Enter a positive number!');
      
            workout = new Running([lat, lng], distance, duration, temp);
        }
      
        //_____If the workout is a Cycling, create a Cycling object_____
        if (type === 'cycling') {
            const climb = +inputClimb.value;
            // Check data valid
            if (!areNumbers(distance, duration, climb) || !areNumbersPositive(distance, duration))
            return alert('Enter a positive number!');
            
            workout = new Cycling([lat, lng], distance, duration, climb);
        }

        //______Add a new object to the training array_____
        this.#workouts.push(workout);

        //_____Show workout on map_____
        this._displayWorkout(workout);

        //____Add workout to list_____
        this._displayWorkoutOnSidebar(workout);

        //   clean input
        this._hideForm();

        // Add all workouts to local storage
        this._addWorkoutsToLocalStorage();
    }
    
    _displayWorkout(workout) {
      L.marker(workout.coords, {opacity: 0.7})
      .addTo(this.#map)
      .bindPopup(L.popup({autoClose: false, closeOnClick: false, className: `${workout.type}-popup`}))
      .setPopupContent(`${workout.type === 'running' ? '🏃' : '🚵‍♂️'} ${workout.description}`)
      .openPopup();
    }

    _displayWorkoutOnSidebar(workout) {
      let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃' : '🚵‍♂️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `
        if (workout.type === 'running') {
          html += `
            <div class="workout__details">
              <span class="workout__icon">📏⏱</span>
              <span class="workout__value">${workout.pace.toFixed(2)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">👟⏱</span>
              <span class="workout__value">${workout.temp}</span>
              <span class="workout__unit">step/min</span>
            </div>
          </li>
          ` ;}
          if (workout.type === 'cycling') {
          html += `
            <div class="workout__details">
              <span class="workout__icon">📏⏱</span>
              <span class="workout__value">${workout.speed.toFixed(2)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🏔</span>
              <span class="workout__value">${workout.climb}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>
        `
        }
        form.insertAdjacentHTML('afterend', html);
    }

    _moveToWorkout(e) {
      const workoutElement = e.target.closest('.workout');
      //console.log(workoutElement);

      if(!workoutElement) return;
      const workout = this.#workouts.find(
        item => item.id === workoutElement.dataset.id
      );
  
      this.#map.setView(workout.coords, 13, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
      //workout.click();
      //console.log(workout);
    }

    _addWorkoutsToLocalStorage() {
      localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorageData() {
      const data = JSON.parse(localStorage.getItem('workouts'));
      //console.log(data);
  
      if (!data) return;
  
      this.#workouts = data;
  
      this.#workouts.forEach(workout => {
        this._displayWorkoutOnSidebar(workout);
      });
    }

    reset() {
      localStorage.removeItem('workouts');
      location.reload();
    }
}

const app = new App();
