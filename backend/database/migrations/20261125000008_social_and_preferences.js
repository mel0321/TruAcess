export async function up(knex) {
  await knex.schema.alterTable('reviews', (table) => {
    table.text('criteria_ratings').nullable();
  });
  await knex.schema.createTable('social_posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('place_id').nullable().references('id').inTable('places').onDelete('SET NULL');
    table.text('caption').nullable();
    table.text('location').nullable();
    table.text('hashtags').nullable();
    table.text('privacy').notNullable().defaultTo('PUBLIC');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('social_post_photos', (table) => {
    table.increments('id').primary();
    table.integer('post_id').notNullable().references('id').inTable('social_posts').onDelete('CASCADE');
    table.text('photo_url').notNullable();
  });
  await knex.schema.createTable('social_follows', (table) => {
    table.increments('id').primary();
    table.integer('follower_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('following_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.unique(['follower_id', 'following_id']);
  });
  await knex.schema.createTable('social_likes', (table) => {
    table.increments('id').primary();
    table.integer('post_id').notNullable().references('id').inTable('social_posts').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.unique(['post_id', 'user_id']);
  });
  await knex.schema.createTable('social_comments', (table) => {
    table.increments('id').primary();
    table.integer('post_id').notNullable().references('id').inTable('social_posts').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('comment').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('social_comments');
  await knex.schema.dropTableIfExists('social_likes');
  await knex.schema.dropTableIfExists('social_follows');
  await knex.schema.dropTableIfExists('social_post_photos');
  await knex.schema.dropTableIfExists('social_posts');
  await knex.schema.alterTable('reviews', (table) => table.dropColumn('criteria_ratings'));
}
