import os

d = os.path.join("C:/Kealee-Platform v10", "services", "api", "src", "modules", "pm")

def w(name, content):
    with open(os.path.join(d, name), "w", newline=chr(10)) as f:
        f.write(content)
    print("Created: " + name)
