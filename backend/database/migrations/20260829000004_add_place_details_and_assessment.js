/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('places', (table) => {
    table.text('category_detail').nullable();
    table.text('phone').nullable();
    table.text('website').nullable();
    table.text('opening_hours').nullable();
    table.text('accessibility_assessment').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('places', (table) => {
    table.dropColumn('accessibility_assessment');
    table.dropColumn('opening_hours');
    table.dropColumn('website');
    table.dropColumn('phone');
    table.dropColumn('category_detail');
  });
}
