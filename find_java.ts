import { execSync } from 'child_process';
try {
  console.log("Checking if android-sdk can be installed via apt...");
  try {
    const info = execSync('apt-cache show android-sdk', { encoding: 'utf-8' });
    console.log("android-sdk show info:\n", info);
  } catch (err) {
    console.log("android-sdk package not found in apt cache. Checking other packages...");
    try {
      const search = execSync('apt-cache search android', { encoding: 'utf-8' });
      console.log("Apt search results containing android:\n", search);
    } catch (e) {
      console.log("Apt-cache search failed too");
    }
  }
} catch (e) {
  console.error(e);
}
