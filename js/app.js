// Sinop House - Static Mode Integration
// Frontend Logic: Local JSON Files + FullCalendar

class StaticLoader {
  constructor() {
    // List of hotel files to load. In a real static setup, this might be generated or fetched from an index.
    // For now, we list the known files manually.
    this.hotelFiles = ['cottage-king.json', 'cottage-twin.json']; 
    this.hotelsPath = '/content/hotels/';
  }

  async init() {
    console.log('StaticLoader: Initializing...');
    
    // 1. Load Hotels Data
    const hotels = await this.loadHotels();
    
    // 2. Initialize Calendar
    this.initCalendar(hotels);

    // 3. Render Content
    if (hotels.length > 0) {
      this.renderAccommodations(hotels);
    }

    // 4. Load Site Settings
    await this.loadSettings();

    // 5. Init Chat Widget
    this.initChatWidget();

    // 6. Init Booking Widget
    this.initBookingWidget();
    
    // 7. Init Calendar Modal
    this.initCalendarModal();
  }

  initBookingWidget() {
      // Widget Guest Logic
      this.widgetGuests = { adults: 2, children: 0 };
      this.selectedCottage = 'Любой коттедж'; // Default

      // Cottage Type Selector
      const cottageTrigger = document.getElementById('widget-cottage-trigger');
      const cottageDropdown = document.getElementById('widget-cottage-dropdown');
      const cottageArrow = document.getElementById('widget-cottage-arrow');
      const cottageText = document.getElementById('widget-cottage-text');

      if (cottageTrigger) {
          cottageTrigger.addEventListener('click', (e) => {
              // Close other dropdowns
              if (guestDropdown) guestDropdown.classList.add('hidden');
              
              cottageDropdown.classList.toggle('hidden');
              if (cottageArrow) cottageArrow.classList.toggle('rotate-180');
          });
      }

      window.selectCottage = (type) => {
          this.selectedCottage = type;
          if (cottageText) cottageText.textContent = type;
          if (cottageDropdown) cottageDropdown.classList.add('hidden');
          if (cottageArrow) cottageArrow.classList.remove('rotate-180');
      };
      
      const guestTrigger = document.getElementById('widget-guests-trigger');
      const guestDropdown = document.getElementById('widget-guests-dropdown');
      const guestArrow = document.getElementById('widget-guests-arrow');
      
      if (guestTrigger) {
          guestTrigger.addEventListener('click', (e) => {
              if (e.target.closest('button') || e.target.closest('input') || e.target.closest('label')) return;
              
              // Close other dropdowns
              if (cottageDropdown) cottageDropdown.classList.add('hidden');

              guestDropdown.classList.toggle('hidden');
              guestArrow.classList.toggle('rotate-180');
          });
      }

      window.changeGuestWidget = (type, delta) => {
          if (type === 'adults') {
              this.widgetGuests.adults = Math.max(1, this.widgetGuests.adults + delta);
              document.getElementById('widget-count-adults').textContent = this.widgetGuests.adults;
          } else if (type === 'children') {
              this.widgetGuests.children = Math.max(0, this.widgetGuests.children + delta);
              document.getElementById('widget-count-children').textContent = this.widgetGuests.children;
          }
          const text = `${this.widgetGuests.adults} взрослых · ${this.widgetGuests.children} детей`;
          document.getElementById('widget-guests-text').textContent = text;
      };

      // Dates Trigger
      const datesTrigger = document.getElementById('widget-dates-trigger');
      if (datesTrigger) {
          datesTrigger.addEventListener('click', () => {
               if (cottageDropdown) cottageDropdown.classList.add('hidden');
               if (guestDropdown) guestDropdown.classList.add('hidden');
              this.openCalendarModal();
          });
      }

      // Search Button
      const searchBtn = document.getElementById('widget-search-btn');
      if (searchBtn) {
          searchBtn.addEventListener('click', () => {
              const datesText = document.getElementById('widget-dates-text').textContent;
              const guestsText = document.getElementById('widget-guests-text').textContent;
              const extraBed = document.getElementById('widget-extra-bed')?.checked;
              
              if (datesText.includes('Заезд')) {
                  alert('Пожалуйста, выберите даты проживания');
                  this.openCalendarModal();
                  return;
              }

              let message = `Здравствуйте! Хочу забронировать проживание.\n`;
              message += `🏠 Домик: ${this.selectedCottage}\n`;
              message += `📅 Даты: ${datesText}\n`;
              message += `👥 Гости: ${guestsText}\n`;
              
              if (extraBed) {
                  message += `🛏️ Доп. место: Да\n`;
              }

              message += `Подскажите, есть ли свободные места?`;

              const whatsappUrl = `https://wa.me/79409003340?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
          });
      }
  }

  initCalendarModal() {
      this.calendarModal = document.getElementById('calendar-modal');
      const closeBtn = document.getElementById('calendar-close');
      const backdrop = document.getElementById('calendar-backdrop');
      
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeCalendarModal());
      if (backdrop) backdrop.addEventListener('click', () => this.closeCalendarModal());
  }

  openCalendarModal() {
      if (!this.calendarModal) return;
      this.calendarModal.classList.remove('opacity-0', 'pointer-events-none');
      // Re-render calendar to fix layout issues when shown
      if (this.calendar) this.calendar.updateSize();
  }

  closeCalendarModal() {
      if (!this.calendarModal) return;
      this.calendarModal.classList.add('opacity-0', 'pointer-events-none');
  }

  initBookingModal() {
    // Legacy modal code removed/refactored into widget logic above
    // keeping empty or minimal if needed for compatibility
  }

  openModal(startDate, endDate) {
     // Called by Calendar select
     // Update Widget Text instead of opening another modal
     const datesText = `${startDate} — ${endDate}`;
     document.getElementById('widget-dates-text').textContent = datesText;
     this.closeCalendarModal();
  }


  closeModal() {
    if (!this.modal) return;
    this.modal.classList.add('opacity-0', 'pointer-events-none');
    if (this.calendar) this.calendar.unselect();
  }

  initChatWidget() {
    const trigger = document.getElementById('chat-trigger');
    const menu = document.getElementById('chat-menu');
    const iconOpen = document.getElementById('icon-open');
    const iconClose = document.getElementById('icon-close');

    if (!trigger || !menu) return;

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', !isExpanded);
      
      if (!isExpanded) {
        menu.classList.remove('opacity-0', 'translate-y-4', 'invisible');
        iconOpen.classList.add('hidden');
        iconClose.classList.remove('hidden');
      } else {
        menu.classList.add('opacity-0', 'translate-y-4', 'invisible');
        iconOpen.classList.remove('hidden');
        iconClose.classList.add('hidden');
      }
    });
  }

  async loadSettings() {
    try {
      const response = await fetch('/content/settings.json');
      if (response.ok) {
        const settings = await response.json();
        this.applySettings(settings);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  applySettings(settings) {
    if (settings.hero_title) this.updateElement('hero_title', settings.hero_title);
    if (settings.hero_subtitle) this.updateElement('hero_subtitle', settings.hero_subtitle);
    // About section title if exists
    // if (settings.about_title) this.updateElement('about_title', settings.about_title); 
    if (settings.about_text) {
       const el = document.getElementById('about_text');
       if (el) el.innerHTML = settings.about_text.replace(/\n/g, '<br>');
    }
    
    if (settings.contact_address) this.updateElement('contact_address', settings.contact_address);
    if (settings.contact_phone) {
       // Update logic for phone links if needed, simplified here
    }
  }

  async loadHotels() {
    const hotels = [];
    for (const file of this.hotelFiles) {
      try {
        const response = await fetch(`${this.hotelsPath}${file}`);
        if (response.ok) {
          const data = await response.json();
          hotels.push(data);
        } else {
          console.warn(`Failed to fetch ${file}: ${response.status}`);
        }
      } catch (e) {
        console.error(`Error loading hotel ${file}:`, e);
      }
    }
    return hotels;
  }

  initCalendar(hotels) {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    // Aggregate booked dates from all hotels
    this.bookedEvents = [];
    hotels.forEach(hotel => {
      if (hotel.booked_dates && Array.isArray(hotel.booked_dates)) {
        hotel.booked_dates.forEach(date => {
          this.bookedEvents.push({
            start: date,
            display: 'background',
            color: '#ff4d4d',
            title: 'Занято',
            classNames: ['booked-date'] // Helper for checking
          });
        });
      }
    });

    // Selection state
    this.selectionStart = null;
    this.selectionEvent = null;

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'ru',
      // Merge booked events with potential selection events
      events: this.bookedEvents,
      selectable: false, // We implement custom Click-Click logic
      headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: '' 
      },
      buttonText: {
        today: 'Сегодня',
        month: 'Месяц'
      },
      dateClick: (info) => {
          this.handleDateClick(info);
      },
      eventClick: (info) => {
          if (info.event.display === 'background' && info.event.backgroundColor === '#ff4d4d') {
             alert('Эта дата уже занята.');
          }
      }
    });
    this.calendar.render();
  }

  handleDateClick(info) {
      const clickedDate = info.dateStr;

      // Check if clicked date is booked
      if (this.isDateBooked(clickedDate)) {
          alert('Эта дата занята.');
          return;
      }

      if (!this.selectionStart) {
          // First click: Start selection
          this.selectionStart = clickedDate;
          
          // Visual feedback: Highlight start date
          this.renderSelection(clickedDate, clickedDate);
          
      } else {
          // Second click: End selection
          let start = this.selectionStart;
          let end = clickedDate;

          // Swap if needed
          if (new Date(end) < new Date(start)) {
              [start, end] = [end, start];
          }

          // Validate range (check if any booked date is inside)
          if (this.isRangeBooked(start, end)) {
              alert('В выбранном диапазоне есть занятые даты. Пожалуйста, выберите свободные даты.');
              // Reset selection to just this new click or clear? Let's restart.
              this.selectionStart = clickedDate;
              this.renderSelection(clickedDate, clickedDate);
              return;
          }

          // Valid range selected
          this.renderSelection(start, end);
          
          // Delay slightly to show selection then close
          setTimeout(() => {
              this.openModal(start, end);
              // Reset selection for next time (or keep it shown? better reset internal state)
              this.selectionStart = null;
              this.clearSelectionEvent(); 
              // Note: openModal updates text and closes modal. 
              // We might want to keep the selection visible if user re-opens calendar?
              // For simplicity, we clear internal state but text is saved.
          }, 300);
      }
  }

  renderSelection(start, end) {
      // Remove previous selection event
      this.clearSelectionEvent();

      // Add new event
      // If start == end, it's a single day highlight
      // FullCalendar background events are exclusive for end date, so add 1 day to end
      let endDateObj = new Date(end);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endStr = endDateObj.toISOString().split('T')[0];

      this.selectionEvent = this.calendar.addEvent({
          start: start,
          end: endStr,
          display: 'background',
          backgroundColor: '#38786a', // Pine color for selection
          classNames: ['user-selection']
      });
  }

  clearSelectionEvent() {
      if (this.selectionEvent) {
          this.selectionEvent.remove();
          this.selectionEvent = null;
      }
  }

  isDateBooked(dateStr) {
      return this.bookedEvents.some(e => e.start === dateStr);
  }

  isRangeBooked(startStr, endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      return this.bookedEvents.some(e => {
          const booked = new Date(e.start);
          return booked >= start && booked <= end;
      });
  }

  renderAccommodations(hotels) {
    const container = document.getElementById('accommodations_list');
    if (!container) return;
    
    container.innerHTML = hotels.map(hotel => `
      <div class="card-lux bg-white rounded-3xl overflow-hidden border border-pine/5 shadow-sm group">
        <div class="aspect-[4/3] overflow-hidden relative">
          <img src="${hotel.image || '/assets/main.webp'}" alt="${hotel.title}" 
               class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-pine shadow-sm">
            от ${hotel.price} ₽
          </div>
        </div>
        <div class="p-6">
          <h3 class="font-display text-xl font-medium text-pine mb-2">${hotel.title}</h3>
          <p class="text-charcoal/60 text-sm mb-4 line-clamp-3">${hotel.description || ''}</p>
          <a href="#booking" class="inline-flex items-center text-terracotta text-sm font-medium hover:text-cinnamon transition-colors">
            Забронировать <i data-lucide="arrow-right" class="w-4 h-4 ml-2"></i>
          </a>
        </div>
      </div>
    `).join('');
    
    // Re-initialize icons if needed
    if (window.lucide) window.lucide.createIcons();
  }

  updateHero(hotel) {
    // Optional: Update hero section if desired
    // this.updateElement('hero_title', hotel.title);
    // this.updateElement('hero_subtitle', hotel.description);
  }

  updateElement(id, content) {
    const el = document.getElementById(id);
    if (el && content) el.textContent = content;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loader = new StaticLoader();
  loader.init();
});
