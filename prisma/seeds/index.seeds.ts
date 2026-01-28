import { seedJobCategories } from "./job-categories.seeds"

async function seed(){
    // Seed Function Call Goes Here
   seedJobCategories()
}

seed().then(()=>{
    console.log("ALL SEEDING DONE")
})