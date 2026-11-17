
async function testRegistration() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: "Test Student",
                    email: "teststudent@example.com",
                    password: "Student@123456"
                })
            }
        );

        const data = await response.json();

        console.log("Status:", response.status);
        console.log("Response:", data);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

testRegistration();
