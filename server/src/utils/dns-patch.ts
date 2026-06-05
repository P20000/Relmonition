import dns from 'dns';

// Configure public DNS servers for reliable resolution in the cloud
try {
  console.log('[DNS] Initializing public DNS servers (1.1.1.1, 8.8.8.8) for reliable host resolution...');
  dns.setServers(['1.1.1.1', '8.8.8.8']);
  
  // Monkey-patch dns.lookup for Turso database hostname
  const originalLookup = dns.lookup as any;
  // @ts-ignore
  dns.lookup = function(hostname: string, options: any, callback: any) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    const isLocalOrInternal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.svc') ||
      hostname.endsWith('.cluster.local');
    
    if (!isLocalOrInternal) {
      dns.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          originalLookup(hostname, options, callback);
        } else {
          const ip = addresses[0];
          console.log(`[DNS Override] Successfully resolved ${hostname} to ${ip} via dns.resolve4 (all: ${!!(options && options.all)})`);
          if (options && options.all) {
            callback(null, [{ address: ip, family: 4 }]);
          } else {
            callback(null, ip, 4);
          }
        }
      });
    } else {
      originalLookup(hostname, options, callback);
    }
  } as any;
} catch (e: any) {
  console.warn('[DNS] Failed to set public DNS servers or patch lookup:', e.message);
}
