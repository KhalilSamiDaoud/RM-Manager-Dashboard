var globalConfigVars;

async function loadConfig() {
    await fetch("../config/CONFIG_dashbordenv.json")
        .then(response => {
            return response.json();
        })
        .then(data => { globalConfigVars = data; })
        .catch( (err) => {
            console.warn("Error loading global configuration file. Check: config/CONFIG_dashbordenv.json");
            console.error(err);
        });
}

await loadConfig();

export { loadConfig, globalConfigVars };