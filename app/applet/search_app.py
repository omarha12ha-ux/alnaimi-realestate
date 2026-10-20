import os
import re

bin_path = '/app/applet/recovered_chunk_1.bin'

with open(bin_path, 'rb') as f:
    chunk = f.read()

print(f"Heap chunk size: {len(chunk)} bytes")

# Search for typical App.tsx start patterns
# We know it imports from "./lib/firebase" or "./types" or "./translations"
targets = [
    b"import { db } from './lib/firebase';",
    b'import { db } from "./lib/firebase";',
    b"import { db, auth } from './lib/firebase';",
    b'import { db, auth } from "./lib/firebase";',
    b"import { db, auth, storage } from './lib/firebase';",
    b"from './lib/firebase'",
    b'from "./lib/firebase"',
    b"from './types'",
    b'from "./types"',
    b"import LandingPage from",
    b"import InteractiveMap from",
]

for t in targets:
    matches = [m.start() for m in re.finditer(re.escape(t), chunk)]
    if matches:
        print(f"\nTarget: {t}")
        for idx in matches:
            # Let's print surrounding 200 bytes
            start = max(0, idx - 100)
            end = min(len(chunk), idx + 150)
            print(f"  Match at index {idx}:")
            print(chunk[start:end].decode('utf-8', errors='ignore'))
            print("-" * 40)
