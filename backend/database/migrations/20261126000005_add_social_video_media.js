export async function up(knex) {
  await knex.schema.alterTable('social_post_photos', (table) => {
    table.text('media_type').notNullable().defaultTo('IMAGE');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('social_post_photos', (table) => {
    table.dropColumn('media_type');
  });
}
