set -e

echo "Инициализация базы данных"

until pg_isready -U postgres; do
  echo "Ожидание PostgreSQL..."
  sleep 2
done

if ! psql -U postgres -d kWorking -c "SELECT 1 FROM \"WorkPlaces\" LIMIT 1;" > /dev/null 2>&1; then
    echo "Восстанавливаем данные из backup.sql..."
    psql -U postgres -d kWorking < /docker-entrypoint-initdb.d/backup.sql
    echo "Данные успешно загружены!"
else
    echo "Данные уже существуют, пропускаем восстановление."
fi