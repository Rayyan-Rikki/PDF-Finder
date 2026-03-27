import { createAdminClient } from "./admin";

export async function ensureBucketExists(bucketName: string) {
  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const exists = buckets.some((b) => b.name === bucketName);
  
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false,
    });
    
    if (createError) {
      console.error(`Error creating bucket ${bucketName}:`, createError);
    } else {
      console.log(`Bucket ${bucketName} created successfully`);
    }
  }
}
