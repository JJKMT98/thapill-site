// Full ISO 3166-1 alpha-2 country list + searchable picker widget.
// Exposes window.Countries = { list, byCode, picker(inputEl, opts) }.
(function () {
  const list = [
    { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' }, { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' }, { code: 'CV', name: 'Cape Verde' }, { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (DRC)' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: "Côte d'Ivoire" },
    { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czechia' }, { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' }, { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' }, { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' }, { code: 'GD', name: 'Grenada' }, { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' }, { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' }, { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' },
    { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MO', name: 'Macau' },
    { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' }, { code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' }, { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' }, { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' }, { code: 'KP', name: 'North Korea' },
    { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' }, { code: 'PS', name: 'Palestine' },
    { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' }, { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' }, { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'São Tomé and Príncipe' },
    { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' },
    { code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Türkiye' },
    { code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' }, { code: 'VA', name: 'Vatican City' }, { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' }, { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },
  ];

  // ISO → dial code (no + prefix). Covers the full list above.
  const dial = {
    AF:'93',AL:'355',DZ:'213',AD:'376',AO:'244',AG:'1-268',AR:'54',AM:'374',AU:'61',AT:'43',AZ:'994',
    BS:'1-242',BH:'973',BD:'880',BB:'1-246',BY:'375',BE:'32',BZ:'501',BJ:'229',BT:'975',BO:'591',
    BA:'387',BW:'267',BR:'55',BN:'673',BG:'359',BF:'226',BI:'257',KH:'855',CM:'237',CA:'1',CV:'238',
    CF:'236',TD:'235',CL:'56',CN:'86',CO:'57',KM:'269',CG:'242',CD:'243',CR:'506',CI:'225',HR:'385',
    CU:'53',CY:'357',CZ:'420',DK:'45',DJ:'253',DM:'1-767',DO:'1-809',EC:'593',EG:'20',SV:'503',
    GQ:'240',ER:'291',EE:'372',SZ:'268',ET:'251',FJ:'679',FI:'358',FR:'33',GA:'241',GM:'220',GE:'995',
    DE:'49',GH:'233',GR:'30',GD:'1-473',GT:'502',GN:'224',GW:'245',GY:'592',HT:'509',HN:'504',HK:'852',
    HU:'36',IS:'354',IN:'91',ID:'62',IR:'98',IQ:'964',IE:'353',IL:'972',IT:'39',JM:'1-876',JP:'81',
    JO:'962',KZ:'7',KE:'254',KI:'686',KW:'965',KG:'996',LA:'856',LV:'371',LB:'961',LS:'266',LR:'231',
    LY:'218',LI:'423',LT:'370',LU:'352',MO:'853',MG:'261',MW:'265',MY:'60',MV:'960',ML:'223',MT:'356',
    MH:'692',MR:'222',MU:'230',MX:'52',FM:'691',MD:'373',MC:'377',MN:'976',ME:'382',MA:'212',MZ:'258',
    MM:'95',NA:'264',NR:'674',NP:'977',NL:'31',NZ:'64',NI:'505',NE:'227',NG:'234',KP:'850',MK:'389',
    NO:'47',OM:'968',PK:'92',PW:'680',PS:'970',PA:'507',PG:'675',PY:'595',PE:'51',PH:'63',PL:'48',
    PT:'351',QA:'974',RO:'40',RU:'7',RW:'250',KN:'1-869',LC:'1-758',VC:'1-784',WS:'685',SM:'378',
    ST:'239',SA:'966',SN:'221',RS:'381',SC:'248',SL:'232',SG:'65',SK:'421',SI:'386',SB:'677',SO:'252',
    ZA:'27',KR:'82',SS:'211',ES:'34',LK:'94',SD:'249',SR:'597',SE:'46',CH:'41',SY:'963',TW:'886',
    TJ:'992',TZ:'255',TH:'66',TL:'670',TG:'228',TO:'676',TT:'1-868',TN:'216',TR:'90',TM:'993',TV:'688',
    UG:'256',UA:'380',AE:'971',GB:'44',US:'1',UY:'598',UZ:'998',VU:'678',VA:'39',VE:'58',VN:'84',YE:'967',
    ZM:'260',ZW:'263',
  };

  const byCode = (code) => list.find((c) => c.code === (code || '').toUpperCase()) || null;
  const dialFor = (code) => dial[(code || '').toUpperCase()] || '';

  // Styles injected once
  let injected = false;
  function injectStyles() {
    if (injected) return;
    injected = true;
    const s = document.createElement('style');
    s.textContent = `
      .country-picker { position: relative; }
      .country-picker-trigger {
        width: 100%; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border);
        border-radius: 10px; color: var(--text); font-family: 'Space Grotesk', sans-serif; font-size: 15px;
        cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;
        transition: border-color 0.3s, box-shadow 0.3s;
      }
      .country-picker-trigger:hover, .country-picker.open .country-picker-trigger {
        border-color: var(--electric); box-shadow: 0 0 0 3px rgba(0,255,136,0.1);
      }
      .country-picker-trigger .placeholder { color: var(--text-dim); opacity: 0.5; }
      .country-picker-trigger .caret { color: var(--text-dim); font-size: 10px; margin-left: 8px; transition: transform 0.2s; }
      .country-picker.open .country-picker-trigger .caret { transform: rotate(180deg); }
      .country-picker-dropdown {
        position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 1000;
        background: var(--card); border: 1px solid var(--border); border-radius: 10px;
        max-height: 280px; display: none; flex-direction: column; overflow: hidden;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      }
      .country-picker.open .country-picker-dropdown { display: flex; }
      .country-picker-search {
        padding: 10px 12px; background: var(--surface); border: none; border-bottom: 1px solid var(--border);
        color: var(--text); font-family: 'Space Grotesk', sans-serif; font-size: 14px; outline: none;
      }
      .country-picker-search::placeholder { color: var(--text-dim); opacity: 0.5; }
      .country-picker-list { overflow-y: auto; }
      .country-picker-list::-webkit-scrollbar { width: 4px; }
      .country-picker-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      .country-picker-option {
        padding: 10px 14px; font-size: 14px; cursor: pointer; display: flex; justify-content: space-between;
        transition: background 0.15s;
      }
      .country-picker-option:hover, .country-picker-option.active { background: rgba(0,255,136,0.08); color: var(--electric); }
      .country-picker-option .code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); }
      .country-picker-empty { padding: 16px; text-align: center; color: var(--text-dim); font-size: 13px; }
    `;
    document.head.appendChild(s);
  }

  // picker(hiddenInput, opts)
  // Replaces a text/hidden input with a searchable country dropdown.
  // The original input keeps the 2-letter code as its value (form posts it as usual).
  function picker(input, opts = {}) {
    if (!input) return;
    if (input.dataset.pickerBound) return;
    input.dataset.pickerBound = '1';
    injectStyles();

    const wrapper = document.createElement('div');
    wrapper.className = 'country-picker';
    input.parentNode.insertBefore(wrapper, input);
    input.type = 'hidden';
    wrapper.appendChild(input);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'country-picker-trigger';
    trigger.innerHTML = `<span class="label"></span><span class="caret">▾</span>`;
    wrapper.appendChild(trigger);

    const dropdown = document.createElement('div');
    dropdown.className = 'country-picker-dropdown';
    dropdown.innerHTML = `
      <input type="text" class="country-picker-search" placeholder="Search country…" autocomplete="off">
      <div class="country-picker-list"></div>
    `;
    wrapper.appendChild(dropdown);

    const search = dropdown.querySelector('.country-picker-search');
    const listEl = dropdown.querySelector('.country-picker-list');
    const label = trigger.querySelector('.label');
    const placeholder = opts.placeholder || 'Select country';

    function renderLabel() {
      const c = byCode(input.value);
      if (c) label.innerHTML = `${c.name} <span class="code" style="color:var(--text-dim);margin-left:6px;">${c.code}</span>`;
      else label.innerHTML = `<span class="placeholder">${placeholder}</span>`;
    }

    function renderList(filter = '') {
      const q = filter.trim().toLowerCase();
      const rows = q
        ? list.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        : list;
      if (!rows.length) {
        listEl.innerHTML = `<div class="country-picker-empty">No match</div>`;
        return;
      }
      listEl.innerHTML = rows.map((c) =>
        `<div class="country-picker-option" data-code="${c.code}"><span>${c.name}</span><span class="code">${c.code}</span></div>`
      ).join('');
      listEl.querySelectorAll('.country-picker-option').forEach((o) => {
        o.addEventListener('click', () => select(o.dataset.code));
      });
    }

    function select(code) {
      input.value = code;
      renderLabel();
      close();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function open() {
      wrapper.classList.add('open');
      search.value = '';
      renderList('');
      setTimeout(() => search.focus(), 50);
    }
    function close() { wrapper.classList.remove('open'); }

    trigger.addEventListener('click', () => {
      wrapper.classList.contains('open') ? close() : open();
    });
    search.addEventListener('input', () => renderList(search.value));
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); trigger.focus(); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const first = listEl.querySelector('.country-picker-option');
        if (first) select(first.dataset.code);
      }
    });
    document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) close(); });

    renderLabel();
    input.addEventListener('change', renderLabel);
  }

  // phonePicker — wraps a phone input with a searchable country dial-code prefix.
  // On submit the number field keeps just the local digits; a hidden `<name>_dial`
  // input carries the +dial prefix. We also expose a combined getValue().
  // opts.linkedCountryInput: an <input name="country"> (from the country picker) —
  // when the linked country changes, the dial code auto-syncs.
  function phonePicker(input, opts = {}) {
    if (!input) return;
    if (input.dataset.phoneBound) return;
    input.dataset.phoneBound = '1';
    injectPhoneStyles();

    const wrapper = document.createElement('div');
    wrapper.className = 'phone-picker';
    input.parentNode.insertBefore(wrapper, input);

    const dialBtn = document.createElement('button');
    dialBtn.type = 'button';
    dialBtn.className = 'phone-picker-dial';
    dialBtn.innerHTML = `<span class="dial-flag">🌐</span><span class="dial-code">+</span><span class="caret">▾</span>`;
    wrapper.appendChild(dialBtn);
    wrapper.appendChild(input);

    // Hidden field carrying the full +E.164-ish value for the form POST
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = input.name + '_dial';
    wrapper.appendChild(hidden);

    const dropdown = document.createElement('div');
    dropdown.className = 'phone-picker-dropdown';
    dropdown.innerHTML = `
      <input type="text" class="phone-picker-search" placeholder="Search country or code…" autocomplete="off">
      <div class="phone-picker-list"></div>
    `;
    wrapper.appendChild(dropdown);

    const search = dropdown.querySelector('.phone-picker-search');
    const listEl = dropdown.querySelector('.phone-picker-list');
    const codeEl = dialBtn.querySelector('.dial-code');

    let currentCC = '';

    function setCountry(cc) {
      currentCC = (cc || '').toUpperCase();
      const d = dialFor(currentCC);
      codeEl.textContent = d ? '+' + d.replace(/-/g, '') : '+';
      syncHidden();
    }

    function syncHidden() {
      const local = (input.value || '').replace(/[^\d]/g, '');
      const d = dialFor(currentCC);
      hidden.value = d ? '+' + d.replace(/-/g, '') + local : local;
    }

    function renderList(filter = '') {
      const q = filter.trim().toLowerCase();
      const digits = q.replace(/\D/g, '');
      const rows = list.filter((c) => {
        const d = dial[c.code] || '';
        if (!d) return false;
        if (!q) return true;
        if (c.name.toLowerCase().includes(q)) return true;
        if (c.code.toLowerCase().includes(q)) return true;
        // Only match against dial code when the user actually typed a digit
        if (digits && d.includes(digits)) return true;
        return false;
      });
      if (!rows.length) {
        listEl.innerHTML = `<div class="country-picker-empty">No match</div>`;
        return;
      }
      listEl.innerHTML = rows.map((c) => {
        const d = dial[c.code];
        return `<div class="phone-picker-option" data-code="${c.code}">
          <span><span class="code">${c.code}</span> ${c.name}</span>
          <span class="dial">+${d.replace(/-/g, '')}</span>
        </div>`;
      }).join('');
      listEl.querySelectorAll('.phone-picker-option').forEach((o) => {
        o.addEventListener('click', () => {
          setCountry(o.dataset.code);
          close();
          input.focus();
        });
      });
    }

    function open() { wrapper.classList.add('open'); search.value = ''; renderList(''); setTimeout(() => search.focus(), 50); }
    function close() { wrapper.classList.remove('open'); }

    dialBtn.addEventListener('click', () => wrapper.classList.contains('open') ? close() : open());
    search.addEventListener('input', () => renderList(search.value));
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); dialBtn.focus(); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const first = listEl.querySelector('.phone-picker-option');
        if (first) { setCountry(first.dataset.code); close(); input.focus(); }
      }
    });
    document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) close(); });
    input.addEventListener('input', syncHidden);

    // Link to the shipping-country picker so changing country auto-picks dial code
    if (opts.linkedCountryInput) {
      opts.linkedCountryInput.addEventListener('change', () => {
        if (!currentCC || currentCC === '' ) setCountry(opts.linkedCountryInput.value);
        else {
          // If phone dial was never manually set, keep it synced; otherwise leave it alone
          setCountry(opts.linkedCountryInput.value);
        }
      });
      if (opts.linkedCountryInput.value) setCountry(opts.linkedCountryInput.value);
    }
  }

  let phoneInjected = false;
  function injectPhoneStyles() {
    if (phoneInjected) return;
    phoneInjected = true;
    const s = document.createElement('style');
    s.textContent = `
      .phone-picker { position: relative; display: flex; align-items: stretch; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; transition: border-color 0.3s, box-shadow 0.3s; }
      .phone-picker:focus-within { border-color: var(--electric); box-shadow: 0 0 0 3px rgba(0,255,136,0.1), 0 0 20px rgba(0,255,136,0.05); }
      .phone-picker-dial {
        background: transparent; border: none; border-right: 1px solid var(--border);
        padding: 0 14px; display: flex; align-items: center; gap: 6px; cursor: pointer;
        color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600;
        min-width: 88px;
      }
      .phone-picker-dial:hover { color: var(--electric); }
      .phone-picker-dial .dial-flag { font-size: 14px; }
      .phone-picker-dial .caret { color: var(--text-dim); font-size: 10px; }
      .phone-picker input[type="tel"], .phone-picker input[type="text"] {
        border: none !important; background: transparent !important; box-shadow: none !important;
        flex: 1; padding: 14px 16px; color: var(--text); font-family: 'Space Grotesk', sans-serif; font-size: 15px; outline: none;
      }
      .phone-picker-dropdown {
        position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 1000;
        background: var(--card); border: 1px solid var(--border); border-radius: 10px;
        max-height: 280px; display: none; flex-direction: column; overflow: hidden;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      }
      .phone-picker.open .phone-picker-dropdown { display: flex; }
      .phone-picker-search {
        padding: 10px 12px; background: var(--surface); border: none; border-bottom: 1px solid var(--border);
        color: var(--text); font-family: 'Space Grotesk', sans-serif; font-size: 14px; outline: none;
      }
      .phone-picker-search::placeholder { color: var(--text-dim); opacity: 0.5; }
      .phone-picker-list { overflow-y: auto; }
      .phone-picker-list::-webkit-scrollbar { width: 4px; }
      .phone-picker-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      .phone-picker-option { padding: 10px 14px; font-size: 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.15s; }
      .phone-picker-option:hover { background: rgba(0,255,136,0.08); color: var(--electric); }
      .phone-picker-option .code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); margin-right: 6px; }
      .phone-picker-option .dial { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--electric); }
    `;
    document.head.appendChild(s);
  }

  window.Countries = { list, byCode, dial, dialFor, picker, phonePicker };
})();
