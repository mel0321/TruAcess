export const config = { transaction: false };

const categories = [
  'ACCOMMODATION',
  'GASTRONOMY',
  'TOURIST_ATTRACTION',
  'SHOPPING',
  'HEALTH',
  'TRANSPORT',
  'EDUCATION',
  'ENTERTAINMENT',
  'SPORTS',
  'RELIGIOUS_SITE',
  'PUBLIC_SERVICE',
  'OTHERS'
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.raw('DROP TRIGGER IF EXISTS update_places_updated_at');
  await knex.raw(`
    CREATE TABLE places_replacement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      establishment_name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN (${categories.map((category) => `'${category}'`).join(', ')})),
      full_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT,
      district TEXT,
      country TEXT NOT NULL DEFAULT 'Brasil',
      description TEXT,
      price DECIMAL(14, 2),
      main_image TEXT,
      has_access_ramp INTEGER NOT NULL DEFAULT 0 CHECK (has_access_ramp IN (0, 1)),
      has_adapted_bathroom INTEGER NOT NULL DEFAULT 0 CHECK (has_adapted_bathroom IN (0, 1)),
      allows_guide_dog INTEGER NOT NULL DEFAULT 0 CHECK (allows_guide_dog IN (0, 1)),
      has_braille_signage INTEGER NOT NULL DEFAULT 0 CHECK (has_braille_signage IN (0, 1)),
      has_sign_language_interpreter INTEGER NOT NULL DEFAULT 0 CHECK (has_sign_language_interpreter IN (0, 1)),
      has_asd_friendly_space INTEGER NOT NULL DEFAULT 0 CHECK (has_asd_friendly_space IN (0, 1)),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      category_detail TEXT,
      phone TEXT,
      website TEXT,
      opening_hours TEXT,
      accessibility_assessment TEXT
    )
  `);
  await knex.raw(`
    INSERT INTO places_replacement (
      id, business_owner_id, establishment_name, category, full_address, city, state,
      district, country, description, price, main_image, has_access_ramp,
      has_adapted_bathroom, allows_guide_dog, has_braille_signage,
      has_sign_language_interpreter, has_asd_friendly_space, created_at, updated_at,
      category_detail, phone, website, opening_hours, accessibility_assessment
    )
    SELECT
      id, business_owner_id, establishment_name,
      CASE
        WHEN category = 'OTHERS' AND category_detail IN ('SHOPPING', 'HEALTH', 'TRANSPORT', 'PUBLIC_SERVICE')
        THEN category_detail
        ELSE category
      END,
      full_address, city, state, NULL, 'Brasil', description, price, main_image, has_access_ramp,
      has_adapted_bathroom, allows_guide_dog, has_braille_signage,
      has_sign_language_interpreter, has_asd_friendly_space, created_at, updated_at,
      CASE
        WHEN category = 'OTHERS' AND category_detail IN ('SHOPPING', 'HEALTH', 'TRANSPORT', 'PUBLIC_SERVICE')
        THEN NULL
        ELSE category_detail
      END,
      phone, website, opening_hours, accessibility_assessment
    FROM places
  `);
  await knex.raw('DROP TABLE places');
  await knex.raw('ALTER TABLE places_replacement RENAME TO places');
  await knex.raw('CREATE INDEX idx_places_establishment_name ON places(establishment_name)');
  await knex.raw('CREATE INDEX idx_places_city ON places(city)');
  await knex.raw('CREATE INDEX idx_places_state ON places(state)');
  await knex.raw('CREATE INDEX idx_places_category ON places(category)');
  await knex.raw('CREATE INDEX idx_places_description ON places(description)');
  await knex.raw('CREATE INDEX idx_places_price ON places(price)');
  await knex.raw('CREATE INDEX idx_places_district ON places(district)');
  await knex.raw('CREATE INDEX idx_places_country ON places(country)');
  await knex.raw(`
    CREATE TRIGGER update_places_updated_at AFTER UPDATE ON places
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE places SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);

  await knex.schema.createTable('place_photos', (table) => {
    table.increments('id').primary();
    table.integer('place_id').notNullable().references('id').inTable('places').onDelete('CASCADE');
    table.text('photo_url').notNullable();
    table.text('photo_type').notNullable();
    table.text('accessibility_category').nullable();
    table.integer('uploaded_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['place_id', 'photo_type'], 'idx_place_photos_place_type');
    table.check("?? IN ('PLACE', 'ACCESSIBILITY')", ['photo_type']);
    table.check(
      "(photo_type = 'PLACE' AND accessibility_category IS NULL) OR " +
      "(photo_type = 'ACCESSIBILITY' AND accessibility_category IN " +
      "('ACCESS_ROUTE', 'RAMP', 'ENTRANCE', 'ADAPTED_BATHROOM', 'PARKING', 'BRAILLE', 'SIGN_LANGUAGE', 'GUIDE_DOG', 'SENSORY_SPACE', 'OTHER'))"
    );
  });
  await knex.raw('PRAGMA foreign_keys = ON');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const unsupportedPlaces = await knex('places')
    .whereNotIn('category', ['ACCOMMODATION', 'GASTRONOMY', 'TOURIST_ATTRACTION', 'OTHERS'])
    .orWhereNotNull('district')
    .orWhereNot('country', 'Brasil')
    .first();
  if (unsupportedPlaces) {
    throw new Error('Cannot roll back expanded places while international, district, or new-category data exists.');
  }
  const uploadedPhotos = await knex('place_photos').first('id');
  if (uploadedPhotos) {
    throw new Error('Cannot roll back while place photos exist.');
  }
  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.schema.dropTableIfExists('place_photos');
  await knex.raw('DROP TRIGGER IF EXISTS update_places_updated_at');
  await knex.raw(`
    CREATE TABLE places_replacement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      establishment_name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('ACCOMMODATION', 'GASTRONOMY', 'TOURIST_ATTRACTION', 'OTHERS')),
      full_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT,
      description TEXT,
      price DECIMAL(14, 2),
      main_image TEXT,
      has_access_ramp INTEGER NOT NULL DEFAULT 0 CHECK (has_access_ramp IN (0, 1)),
      has_adapted_bathroom INTEGER NOT NULL DEFAULT 0 CHECK (has_adapted_bathroom IN (0, 1)),
      allows_guide_dog INTEGER NOT NULL DEFAULT 0 CHECK (allows_guide_dog IN (0, 1)),
      has_braille_signage INTEGER NOT NULL DEFAULT 0 CHECK (has_braille_signage IN (0, 1)),
      has_sign_language_interpreter INTEGER NOT NULL DEFAULT 0 CHECK (has_sign_language_interpreter IN (0, 1)),
      has_asd_friendly_space INTEGER NOT NULL DEFAULT 0 CHECK (has_asd_friendly_space IN (0, 1)),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      category_detail TEXT,
      phone TEXT,
      website TEXT,
      opening_hours TEXT,
      accessibility_assessment TEXT
    )
  `);
  await knex.raw(`
    INSERT INTO places_replacement (
      id, business_owner_id, establishment_name, category, full_address, city, state,
      description, price, main_image, has_access_ramp, has_adapted_bathroom,
      allows_guide_dog, has_braille_signage, has_sign_language_interpreter,
      has_asd_friendly_space, created_at, updated_at, category_detail, phone,
      website, opening_hours, accessibility_assessment
    )
    SELECT
      id, business_owner_id, establishment_name, category, full_address, city, state,
      description, price, main_image, has_access_ramp, has_adapted_bathroom,
      allows_guide_dog, has_braille_signage, has_sign_language_interpreter,
      has_asd_friendly_space, created_at, updated_at, category_detail, phone,
      website, opening_hours, accessibility_assessment
    FROM places
    WHERE category IN ('ACCOMMODATION', 'GASTRONOMY', 'TOURIST_ATTRACTION', 'OTHERS')
  `);
  await knex.raw('DROP TABLE places');
  await knex.raw('ALTER TABLE places_replacement RENAME TO places');
  await knex.raw('CREATE INDEX idx_places_establishment_name ON places(establishment_name)');
  await knex.raw('CREATE INDEX idx_places_city ON places(city)');
  await knex.raw('CREATE INDEX idx_places_state ON places(state)');
  await knex.raw('CREATE INDEX idx_places_category ON places(category)');
  await knex.raw('CREATE INDEX idx_places_description ON places(description)');
  await knex.raw('CREATE INDEX idx_places_price ON places(price)');
  await knex.raw(`
    CREATE TRIGGER update_places_updated_at AFTER UPDATE ON places
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE places SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);
  await knex.raw('PRAGMA foreign_keys = ON');
}
