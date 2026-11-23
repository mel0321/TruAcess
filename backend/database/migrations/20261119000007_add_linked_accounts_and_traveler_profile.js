/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.text('profile_data').nullable();
  });

  await knex.schema.createTable('account_links', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.integer('linked_user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.check('?? <> ??', ['user_id', 'linked_user_id']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('account_links');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('profile_data');
  });
}
