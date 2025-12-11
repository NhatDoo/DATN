export async function syncCourseToService(
  action: 'add' | 'update' | 'delete',
  data: any,
  url: string
) {
  const axios = (await import('axios')).default;
  const replacer = (_k: string, v: any) => (typeof v === 'bigint' ? v.toString() : v);

  try {
    if (action === 'add') {
      await axios.post(url, JSON.parse(JSON.stringify(data, replacer)));
    } else if (action === 'update') {
      await axios.put(`${url}/${data.id}`, JSON.parse(JSON.stringify(data, replacer)));
    } else if (action === 'delete') {
      await axios.delete(`${url}/${data.id}`);
    }

    console.log(`📡 Synced [${action}] → ${url}`);
  } catch (err: any) {
    console.error(`❌ Sync failed [${action}] → ${url}:`, err.message);
  }
}
