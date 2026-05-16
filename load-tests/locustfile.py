from locust import HttpUser, task, between
import random

URLS = ["https://google.com", "https://github.com", "https://wikipedia.org"]

class URLShortenerUser(HttpUser):
    wait_time = between(0.1, 0.5)
    short_codes = []

    def on_start(self):
        for url in URLS:
            res = self.client.post("/api/shorten",
                json={"url": url, "strategy": random.choice(["hash", "snowflake"])})
            if res.status_code == 201:
                URLShortenerUser.short_codes.append(res.json()["short_url"].split("/")[-1])

    @task(7)
    def redirect(self):
        if self.short_codes:
            self.client.get(f"/{random.choice(self.short_codes)}", allow_redirects=False)

    @task(3)
    def shorten(self):
        self.client.post("/api/shorten",
            json={"url": random.choice(URLS), "strategy": random.choice(["hash", "snowflake"])})