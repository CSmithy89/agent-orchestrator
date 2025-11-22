# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Development Login" [level=3] [ref=e6]
      - paragraph [ref=e7]: Enter any username to generate a development token
    - generic [ref=e9]:
      - generic [ref=e10]:
        - text: Username
        - textbox "Username" [ref=e11]:
          - /placeholder: Enter username
          - text: developer
      - button "Login" [ref=e12] [cursor=pointer]
      - paragraph [ref=e13]: Development mode only - no password required
  - region "Notifications (F8)":
    - list
```