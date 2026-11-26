export async function up(knex) {
  await knex.schema.createTable('social_blocks', (table) => {
    table.increments('id').primary();
    table.integer('blocker_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('blocked_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['blocker_id', 'blocked_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('social_blocks');
}
