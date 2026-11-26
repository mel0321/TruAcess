export async function up(knex) {
  await knex.schema.createTable('social_follow_requests', (table) => {
    table.increments('id').primary();
    table.integer('requester_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('requested_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['requester_id', 'requested_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('social_follow_requests');
}
