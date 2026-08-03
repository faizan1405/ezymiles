import re

filepath = "src/scripts/seed.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Strategy: Find the seedPackages closing brace (line 286) and seedHotels opening (line 919)
# Remove everything between them that isn't valid code.

# Find the two anchors
anchor1 = '  console.log(`Seeded ${count} packages.`);\n}\n\n          hotel: "Central Kyoto hotel"'
anchor2 = '\n\nasync function seedHotels(destIds: Map<string, mongoose.Types.ObjectId>) {'

pos1 = content.find(anchor1)
pos2 = content.find(anchor2)

print(f"anchor1 at: {pos1}")
print(f"anchor2 at: {pos2}")

if pos1 >= 0 and pos2 >= 0:
    # Keep everything up to end of anchor1, then skip to anchor2
    # We want to keep content[0 : pos1 + len(anchor1) - len('          hotel: "Central Kyoto hotel"')]
    # and then content[pos2:]
    cutoff = anchor1.index('          hotel: "Central Kyoto hotel"')
    keep_up_to = pos1 + cutoff
    new_content = content[:keep_up_to] + content[pos2:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Fixed! Removed {pos2 - keep_up_to} characters")
    print(f"Original: {len(content)} chars, New: {len(new_content)} chars")
else:
    print("Anchors not found")
